(function () {
  'use strict';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var header = $('#header');
  var nav = $('#main-nav');
  var toggle = $('.nav-toggle');

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !header.contains(e.target)) setMenu(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Active section in the nav ---------- */
  var navLinks = $$('a[href^="#"]', nav);
  var sectionMap = {};
  navLinks.forEach(function (a) {
    var s = $(a.getAttribute('href'));
    if (s) sectionMap[s.id] = a;
  });
  if ('IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target.id === 'top') {
          if (en.isIntersecting) navLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          return;
        }
        var link = sectionMap[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { navObs.observe(doc.getElementById(id)); });
    navObs.observe(doc.getElementById('top'));
  }

  /* ---------- Work: project tabs ---------- */
  var tablist = $('[data-tabs]');
  var tabs = $$('[role="tab"]', tablist);

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = doc.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    if (tab.scrollIntoView && window.matchMedia('(max-width: 900px)').matches) {
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t, false); });
    t.addEventListener('keydown', function (e) {
      var vertical = window.matchMedia('(min-width: 901px)').matches;
      var next = null;
      if (e.key === 'ArrowDown' || (!vertical && e.key === 'ArrowLeft')) next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || (!vertical && e.key === 'ArrowRight')) next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Work: show all / fewer ---------- */
  $$('[data-more]').forEach(function (btn) {
    var panel = btn.closest('.project');
    var label = $('[data-more-label]', btn);
    var total = btn.getAttribute('data-total');
    btn.addEventListener('click', function () {
      var expanded = panel.classList.toggle('is-collapsed') === false;
      btn.setAttribute('aria-expanded', String(expanded));
      label.textContent = expanded ? 'הצגת פחות' : 'הצגת כל ' + total + ' העבודות';
    });
  });

  /* ---------- Lightbox (one video at a time, with sound) ---------- */
  var lb = $('#lightbox');
  var video = $('#lb-video');
  var lbTitle = $('.lb-title', lb);
  var lbPos = $('.lb-pos', lb);
  var current = { list: [], index: 0, opener: null, title: '' };

  function setSource(i) {
    var btn = current.list[i];
    current.index = i;
    if (btn.getAttribute('data-title')) lbTitle.textContent = btn.getAttribute('data-title');
    var wide = btn.getAttribute('data-ratio') === '16 / 9';
    lb.classList.toggle('is-wide', wide);
    video.poster = btn.getAttribute('data-thumb') || '';
    video.src = btn.getAttribute('data-video');
    lbPos.textContent = (i + 1) + ' / ' + current.list.length;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* the viewer can press play */ });
  }

  function openLightbox(btn) {
    var panel = btn.closest('.project');
    var featured = btn.closest('.featured-grid');
    current.list = panel ? $('.vcard', panel) : (featured ? $('.featured-card__play', featured) : [btn]);
    current.opener = btn;
    current.title = panel ? $('h3', panel).textContent : (btn.getAttribute('data-title') || 'עבודות נבחרות');
    lbTitle.textContent = current.title;
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    doc.documentElement.classList.add('lb-open');
    setSource(current.list.indexOf(btn));
  }

  function closeLightbox() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    doc.documentElement.classList.remove('lb-open');
    if (lb.open) { if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open'); }
    if (current.opener) current.opener.focus();
  }

  function step(d) {
    var n = current.list.length;
    if (n < 2) return;
    setSource((current.index + d + n) % n);
  }

  doc.addEventListener('click', function (e) {
    var card = e.target.closest('.vcard, .featured-card__play');
    if (card) openLightbox(card);
  });
  $('.lb-close', lb).addEventListener('click', closeLightbox);
  $('.lb-prev', lb).addEventListener('click', function () { step(-1); });
  $('.lb-next', lb).addEventListener('click', function () { step(1); });
  lb.addEventListener('cancel', function (e) { e.preventDefault(); closeLightbox(); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-inner') || e.target.classList.contains('lb-stage')) closeLightbox();
  });
  lb.addEventListener('keydown', function (e) {
    // RTL page: left = next, right = previous
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(-1); }
  });
  // swipe between videos on touch screens (video controls stay usable)
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 70 && !e.target.closest('.lb-bar')) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- Showreel slot: becomes a player when data-src is set ---------- */
  var reel = $('#showreel');
  var reelSrc = reel && reel.getAttribute('data-src');
  if (reel && reelSrc) {
    var v = doc.createElement('video');
    v.controls = true;
    v.playsInline = true;
    v.preload = 'none';
    v.poster = reel.getAttribute('data-poster') || '';
    v.src = reelSrc;
    reel.innerHTML = '';
    reel.appendChild(v);
    reel.classList.add('is-player');
  }

  /* ---------- Scroll reveal + count-up ---------- */
  function countUp(el) {
    var target = Number(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var start = performance.now();
    var dur = 1500;
    (function frame(now) {
      var t = Math.min((now - start) / dur, 1);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  var targets = $$('.rv');
  // light stagger for items that share a parent list
  ['.svc-list', '.quotes'].forEach(function (sel) {
    var parent = $(sel);
    if (!parent) return;
    $$('.rv', parent).forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        $$('[data-count]', el).forEach(function (c) { if (!reduceMotion) countUp(c); });
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { obs.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }
})();
