/* Knite Lyfe — shared behaviour */
(function () {
  'use strict';

  /* mobile nav */
  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* scroll reveal */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* stagger the hero message thread */
  document.querySelectorAll('.thread .msg').forEach(function (m, i) {
    m.style.animationDelay = reduce ? '0s' : (0.35 + i * 0.5) + 's';
  });


  /* audio: show a friendly placeholder until the mp3 exists */
  document.querySelectorAll('.pod audio').forEach(function (au) {
    au.addEventListener('error', function () {
      var box = document.createElement('div');
      box.className = 'pod-soon';
      box.innerHTML = '<svg width="17" height="17" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
        '<circle cx="8.5" cy="8.5" r="7"/><path d="M8.5 4.8v4l2.6 1.7"/></svg>' +
        '<span>Recording coming soon \u2014 the transcript is below.</span>';
      au.replaceWith(box);
    }, true);
  });

  /* lead-intent tabs (Knite Youth early access) */
  var tabs = document.querySelectorAll('[role="tab"][aria-controls]');
  if (tabs.length) {
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; }
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) { return; }
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  /* analytics hook — no provider is connected yet, so this only records intent.
     When a provider is added, forward these to it from one place. */
  window.knite = window.knite || {};
  window.knite.events = window.knite.events || [];
  window.knite.track = window.knite.track || function (name, detail) {
    window.knite.events.push({ name: name, detail: detail || null, at: Date.now() });
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-analytics]') : null;
    if (el) { window.knite.track(el.getAttribute('data-analytics')); }
  });

  /* Form submission. Posts to the Worker in /worker; falls back to telling
     people to email if anything goes wrong, because a form that silently
     eats a signup is worse than one that admits it is broken. */
  var EMAIL_FALLBACK =
    'Something went wrong on our end. Email adminknitelyfe@gmail.com and we will reply directly.';

  document.querySelectorAll('form[data-endpoint]').forEach(function (f) {
    var note = f.querySelector('.form-note');
    var btn = f.querySelector('button[type="submit"]');
    var original = note ? note.textContent : '';

    function say(msg, tone) {
      if (!note) return;
      note.textContent = msg;
      note.style.color = tone === 'bad' ? '#FDBA74' : tone === 'good' ? '#4ADE80' : '';
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.dataset.busy) return;

      if (!f.checkValidity()) { f.reportValidity(); return; }

      f.dataset.busy = '1';
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      say('Sending…');

      var body = {};
      new FormData(f).forEach(function (v, k) { body[k] = v; });
      body.page = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';

      fetch(f.getAttribute('data-endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { r: r, d: d }; }); })
        .then(function (res) {
          if (res.r.ok && res.d.ok) {
            f.reset();
            say(f.getAttribute('data-success') || "You're on the list. We'll be in touch.", 'good');
            window.knite && window.knite.track('form_submit_ok', f.getAttribute('data-endpoint'));
            return;
          }
          var err = res.d.error;
          say(
            err === 'invalid_email' ? 'That email address does not look right. Mind checking it?'
            : err === 'missing_field' ? 'Please fill in the required fields.'
            : err === 'rate_limited' ? 'That is a lot of submissions from one place. Try again in a little while.'
            : EMAIL_FALLBACK,
            'bad'
          );
          window.knite && window.knite.track('form_submit_error', err || res.r.status);
        })
        .catch(function () {
          say(EMAIL_FALLBACK, 'bad');
          window.knite && window.knite.track('form_submit_network_error');
        })
        .then(function () {
          delete f.dataset.busy;
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send'; }
          setTimeout(function () {
            if (note && note.style.color === 'rgb(74, 222, 128)') { say(original); }
          }, 8000);
        });
    });
  });
})();
