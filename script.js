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

  /* ---------- Lightbox: click to play, one video at a time, with sound ----------
     Nothing plays by itself while scrolling. A tap opens the player and starts the video
     with sound (the tap is the user gesture browsers require). The video plays once (no loop);
     at the end a replay button appears. If a browser still blocks playback, a clear Play button
     is shown instead of a stuck/black player. */
  var lb = $('#lightbox');
  var video = $('#lb-video');
  var overlay = $('.lb-overlay', lb);
  var overlayBtn = $('.lb-overlay-btn', lb);
  var overlayMsg = $('.lb-overlay-msg', lb);
  var spinner = $('.lb-spinner', lb);
  var muteBtn = $('.lb-mute', lb);
  var fullBtn = $('.lb-full', lb);
  var lbTitle = $('.lb-title', lb);
  var lbPos = $('.lb-pos', lb);
  var current = { list: [], index: 0, opener: null, title: '' };
  var token = 0;              // invalidates late results when the viewer switches videos quickly
  var overlayKind = 'play';   // 'play' | 'replay' | 'error'
  var triedOriginal = false;

  video.loop = false;
  video.playsInline = true;

  function showOverlay(kind, msg) {
    overlayKind = kind;
    overlay.classList.toggle('is-replay', kind === 'replay');
    overlayBtn.setAttribute('aria-label', kind === 'replay' ? 'הפעלה חוזרת' : kind === 'error' ? 'ניסיון חוזר' : 'הפעלה');
    overlayMsg.textContent = msg || '';
    overlay.hidden = false;
    try { overlayBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
  function hideOverlay() { overlay.hidden = true; overlayMsg.textContent = ''; }
  function setLoading(on) { spinner.hidden = !on; }
  function syncMute() {
    var m = video.muted || video.volume === 0;
    muteBtn.setAttribute('aria-pressed', String(m));
    muteBtn.setAttribute('aria-label', m ? 'ביטול השתקה' : 'השתקה');
  }

  function attemptPlay(my) {
    var p;
    try { p = video.play(); } catch (e) { p = null; }
    if (!p || typeof p.then !== 'function') return;
    p.then(function () {
      if (my === token) hideOverlay();
    }, function (err) {
      if (my !== token) return;                          // a newer video took over
      if (err && err.name === 'AbortError') return;      // interrupted by a new load
      if (video.error) return;                           // the error handler will explain
      setLoading(false);
      showOverlay('play', 'לחצו להפעלה');                // browser blocked playback with sound
    });
  }

  function loadItem(i) {
    var btn = current.list[i];
    if (!btn) return;
    var my = ++token;
    triedOriginal = false;
    current.index = i;
    video.pause();
    hideOverlay();
    setLoading(true);
    if (btn.getAttribute('data-title')) lbTitle.textContent = btn.getAttribute('data-title');
    lbPos.textContent = (i + 1) + ' / ' + current.list.length;
    lb.classList.toggle('is-wide', btn.getAttribute('data-ratio') === '16 / 9');
    video.loop = false;
    video.muted = false;                                 // every video starts with sound
    video.poster = btn.getAttribute('data-thumb') || '';
    video.src = btn.getAttribute('data-video');
    video.load();
    syncMute();
    attemptPlay(my);
  }

  function openLightbox(btn) {
    var panel = btn.closest('.project');
    var featured = btn.closest('.featured-grid');
    var cards = panel ? panel.querySelectorAll('.vcard') : (featured ? featured.querySelectorAll('.featured-card__play') : [btn]);
    current.list = Array.prototype.slice.call(cards);
    current.opener = btn;
    current.title = panel ? $('h3', panel).textContent : (btn.getAttribute('data-title') || 'עבודות נבחרות');
    lbTitle.textContent = current.title;
    fullBtn.hidden = !(video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    doc.documentElement.classList.add('lb-open');
    loadItem(current.list.indexOf(btn));                 // runs inside the tap, so sound is allowed
    try { video.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function exitFullscreen() {
    var fs = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (!fs) return;
    var exit = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (exit) { try { var r = exit.call(doc); if (r && r.catch) r.catch(function () {}); } catch (e) { /* ignore */ } }
  }

  function closeLightbox() {
    token++;
    exitFullscreen();
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
    hideOverlay();
    setLoading(false);
    doc.documentElement.classList.remove('lb-open');
    if (lb.open) { if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open'); }
    if (current.opener) { try { current.opener.focus(); } catch (e) { /* ignore */ } }
  }

  function step(d) {
    var n = current.list.length;
    if (n < 2) return;
    loadItem((current.index + d + n) % n);               // pauses the old video, starts the new one with sound
  }

  function toggleFullscreen() {
    if (doc.fullscreenElement || doc.webkitFullscreenElement) { exitFullscreen(); return; }
    var r;
    if (video.requestFullscreen) r = video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();   // iPhone
    if (r && r.catch) r.catch(function () {});
  }

  // --- player events
  video.addEventListener('playing', function () { hideOverlay(); setLoading(false); });
  video.addEventListener('canplay', function () { setLoading(false); });
  video.addEventListener('waiting', function () { if (!video.paused && !video.ended) setLoading(true); });
  video.addEventListener('volumechange', syncMute);
  video.addEventListener('ended', function () { setLoading(false); showOverlay('replay', ''); });
  video.addEventListener('error', function () {
    var src = video.getAttribute('src');
    if (!src) return;                                    // we just cleared it on close
    if (!triedOriginal && src.indexOf('/light/') !== -1) {
      triedOriginal = true;                              // light copy failed: fall back to the original file
      video.src = src.replace('/light/', '/');
      video.load();
      attemptPlay(token);
      return;
    }
    setLoading(false);
    showOverlay('error', 'הסרטון לא נטען. בדקו את החיבור ונסו שוב');
  });

  overlayBtn.addEventListener('click', function () {
    if (overlayKind === 'error') { loadItem(current.index); return; }
    if (overlayKind === 'replay') video.currentTime = 0;
    hideOverlay();
    attemptPlay(token);                                  // this tap is the gesture that allows sound
  });

  muteBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    syncMute();
  });
  fullBtn.addEventListener('click', toggleFullscreen);

  doc.addEventListener('visibilitychange', function () { if (doc.hidden && lb.open) video.pause(); });

  // --- opening / closing / navigation
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

  // swipe between videos on touch screens; gestures that start on the control bar
  // (scrubbing the progress bar, volume) or on a button never switch videos
  var touch = null;
  lb.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { touch = null; return; }
    var t = e.changedTouches[0];
    var r = video.getBoundingClientRect();
    var onControls = e.target.closest('.lb-bar, .lb-tools, .lb-close, .lb-overlay-btn') ||
      (e.target === video && t.clientY > r.bottom - 76);
    touch = onControls ? null : { x: t.clientX, y: t.clientY };
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (!touch) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
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
