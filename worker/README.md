# Form backend — setup

The Worker and schema are written and tested locally. Three steps remain, and
all three need your Cloudflare account, so they're yours to run.

## 1. Create the database

```bash
npx wrangler d1 create knitelyfe-signups
```

It prints a `database_id`. Paste it into `wrangler.jsonc`, replacing
`PASTE_DATABASE_ID_HERE`. That ID is not a secret — it's safe in the public repo.

## 2. Create the tables

```bash
npx wrangler d1 migrations apply knitelyfe-signups --remote
```

Without `--remote` it only touches the local copy.

## 3. Set the two secrets

```bash
npx wrangler secret put ADMIN_TOKEN
```

```bash
npx wrangler secret put IP_SALT
```

Each prompts for a value. Use long random strings — generate them with
`openssl rand -base64 32`. They are **not** stored in the repo.

- `ADMIN_TOKEN` guards the export endpoint. Without it set, `/api/signups`
  returns 404 rather than 401, so the endpoint doesn't announce itself.
- `IP_SALT` salts the IP hashes. Changing it later orphans existing hashes,
  which only affects rate limiting, not the signups themselves.

Then deploy as usual — or just push, since Cloudflare builds from GitHub.

---

## Reading your signups

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://knitelyfe.com/api/signups?format=csv" -o signups.csv
```

Drop `?format=csv` for JSON. Add `?form=campus` or `?form=waitlist` to filter.

## Working on it locally

```bash
npx wrangler dev
```

Uses a local SQLite file, never production data. Local secrets live in
`.dev.vars`, which is gitignored.

Apply migrations locally first:

```bash
npx wrangler d1 migrations apply knitelyfe-signups --local
```

---

## What it does

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/waitlist` | POST | Contact / waitlist form |
| `/api/campus` | POST | University form |
| `/api/signups` | GET | Export, bearer-token protected |

Everything else falls through to the static site, so there's still one deploy
and one domain.

**Validation** — required fields, a deliberately loose email check, length caps
on every field.

**Duplicates** — someone signing up twice is one keen person, not two leads. A
repeat submission updates their existing row rather than adding another.

**Spam** — a honeypot field (`company`) hidden off-screen; anything in it is
discarded while still returning 200, because telling a bot it was caught only
teaches it to retry. Plus a cap of 8 submissions per IP per hour.

**Privacy** — the IP is salted and hashed, never stored raw, so the table
doesn't become a record of who visited the site. Country is kept, nothing finer.

## Deliberately not built

- **Email notification on signup.** You'd find out about a signup by checking
  the export. Adding Resend or similar is maybe twenty lines, but it's another
  vendor, another secret, and another thing to go wrong — worth doing once
  signups are frequent enough that checking manually is annoying.
- **Turnstile.** Cloudflare's CAPTCHA alternative. The honeypot plus rate limit
  handles casual spam; reach for Turnstile if real spam starts arriving, not
  before. People filling in a waitlist form are doing you a favour and
  shouldn't have to prove they're human.
- **Double opt-in.** If you ever send anything resembling marketing, you'll
  want a confirmation step for CAN-SPAM / GDPR. For "one email when there's
  something to use" it's overkill.

## Note on the privacy policy

The footer's Privacy Policy and Terms links still point at `safety.html` —
neither page exists. Now that the site actually stores names and email
addresses, that gap is worth closing before you drive traffic at the form.
