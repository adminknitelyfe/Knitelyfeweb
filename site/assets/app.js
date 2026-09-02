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

  /* forms are not wired to a backend yet — be honest about it */
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = f.querySelector('.form-note');
      if (note) {
        note.textContent =
          'This form is not connected yet. Email adminknitelyfe@gmail.com and we will reply directly.';
        window.knite && window.knite.track('form_submit_blocked', f.getAttribute('data-intent') || 'general');
        note.style.color = '#FDBA74';
      }
    });
  });
})();
