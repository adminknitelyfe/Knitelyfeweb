/**
 * Knite Lyfe — form backend.
 *
 * The site is static and served from Cloudflare's edge. This Worker sits in
 * front of it: it answers the two form endpoints itself and hands every other
 * request to the static assets, so there is still only one deploy and one
 * domain.
 *
 *   POST /api/waitlist   the contact / waitlist form
 *   POST /api/campus     the university form
 *   GET  /api/signups    export, bearer-token protected
 *
 * Storage is D1 (SQLite). Schema lives in migrations/.
 */

const MAX = { name: 120, email: 254, short: 160, message: 4000 };

/* Deliberately loose. Strict email regexes reject valid addresses, and the
   only thing that actually proves an address works is sending to it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FORMS = {
  '/api/waitlist': {
    form: 'waitlist',
    required: ['name', 'email'],
    optional: ['topic', 'message'],
  },
  '/api/campus': {
    form: 'campus',
    required: ['name', 'email', 'institution', 'message'],
    optional: ['title', 'role'],
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/signups') {
      return request.method === 'GET'
        ? exportSignups(request, env)
        : methodNotAllowed('GET');
    }

    const spec = FORMS[url.pathname];
    if (spec) {
      return request.method === 'POST'
        ? submit(request, env, spec)
        : methodNotAllowed('POST');
    }

    return env.ASSETS.fetch(request);
  },
};

async function submit(request, env, spec) {
  if (!env.DB) return json({ ok: false, error: 'not_configured' }, 503);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  /* Honeypot. A real person never sees this field, so anything in it is a bot.
     Answer 200 anyway — telling a bot it was caught just teaches it to retry
     without the field. */
  if (str(body.company)) return json({ ok: true, queued: true });

  const rec = {};
  for (const key of spec.required) {
    const v = str(body[key]);
    if (!v) return json({ ok: false, error: 'missing_field', field: key }, 400);
    rec[key] = v;
  }
  for (const key of spec.optional) {
    const v = str(body[key]);
    if (v) rec[key] = v;
  }

  rec.email = rec.email.toLowerCase();
  if (!EMAIL.test(rec.email) || rec.email.length > MAX.email) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }
  if (rec.name.length > MAX.name) rec.name = rec.name.slice(0, MAX.name);
  for (const k of ['topic', 'institution', 'title', 'role']) {
    if (rec[k]) rec[k] = rec[k].slice(0, MAX.short);
  }
  if (rec.message) rec.message = rec.message.slice(0, MAX.message);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = await hashIp(ip, env.IP_SALT);

  /* Cheap flood control: cap submissions per IP per hour. Not a substitute for
     Turnstile, but it stops the trivial case without adding a dependency or
     putting a challenge in front of a form people are doing us a favour by
     filling in. */
  if (ipHash) {
    const { results } = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM signups
       WHERE ip_hash = ?1 AND created_at > datetime('now', '-1 hour')`
    ).bind(ipHash).all();
    if ((results?.[0]?.n ?? 0) >= 8) {
      return json({ ok: false, error: 'rate_limited' }, 429);
    }
  }

  try {
    await env.DB.prepare(
      `INSERT INTO signups
         (form, name, email, topic, institution, title, role, message, page, country, ip_hash)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)
       ON CONFLICT(form, email) DO UPDATE SET
         name       = excluded.name,
         topic      = COALESCE(excluded.topic, signups.topic),
         institution= COALESCE(excluded.institution, signups.institution),
         title      = COALESCE(excluded.title, signups.title),
         role       = COALESCE(excluded.role, signups.role),
         message    = COALESCE(excluded.message, signups.message),
         updated_at = datetime('now')`
    ).bind(
      spec.form,
      rec.name,
      rec.email,
      rec.topic ?? null,
      rec.institution ?? null,
      rec.title ?? null,
      rec.role ?? null,
      rec.message ?? null,
      str(body.page).slice(0, MAX.short) || null,
      request.cf?.country ?? null,
      ipHash
    ).run();
  } catch (err) {
    console.error('signup insert failed', err);
    return json({ ok: false, error: 'storage_failed' }, 500);
  }

  return json({ ok: true });
}

/**
 * Export. Protected by a bearer token held as a Worker secret — without
 * ADMIN_TOKEN set this returns 404 rather than 401, so the endpoint does not
 * announce itself on a deployment that never configured it.
 */
async function exportSignups(request, env) {
  if (!env.ADMIN_TOKEN) return new Response('Not found', { status: 404 });
  if (!env.DB) return json({ ok: false, error: 'not_configured' }, 503);

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!timingSafeEqual(token, env.ADMIN_TOKEN)) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const form = url.searchParams.get('form');
  const stmt = form
    ? env.DB.prepare(
        `SELECT created_at, form, name, email, topic, institution, title, role, message, country
         FROM signups WHERE form = ?1 ORDER BY created_at DESC`
      ).bind(form)
    : env.DB.prepare(
        `SELECT created_at, form, name, email, topic, institution, title, role, message, country
         FROM signups ORDER BY created_at DESC`
      );

  const { results } = await stmt.all();

  if (url.searchParams.get('format') === 'csv') {
    const cols = ['created_at','form','name','email','topic','institution','title','role','message','country'];
    const rows = [cols.join(',')];
    for (const r of results) rows.push(cols.map((c) => csv(r[c])).join(','));
    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="knite-signups.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return json({ ok: true, count: results.length, signups: results });
}

/* helpers */

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

async function readBody(request) {
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

/* Store a hash, never the address itself. It is enough to rate-limit with and
   it keeps the table from becoming a list of who visited the site. */
async function hashIp(ip, salt) {
  if (!ip) return null;
  const data = new TextEncoder().encode(`${salt || 'knite'}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function csv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function methodNotAllowed(allow) {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
