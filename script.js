document.getElementById('year').textContent = new Date().getFullYear();

const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile menu
function setMenu(open) {
  mainNav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
}

navToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  if (mainNav.classList.contains('open') && !header.contains(e.target)) setMenu(false);
});

// Header state on scroll
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Count-up for the headline stat
function countUp(el) {
  const target = Number(el.dataset.countTo);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();
  const step = now => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Scroll reveal: stagger siblings inside grids
document.querySelectorAll('.video-card').forEach(card => card.classList.add('reveal'));
document.querySelectorAll('.services-grid, .why-grid, .video-grid, .testimonials-grid').forEach(grid => {
  grid.querySelectorAll(':scope > .reveal').forEach((item, i) => {
    item.style.setProperty('--delay', `${(i % 3) * 0.1}s`);
  });
});

const revealTargets = document.querySelectorAll('.reveal, .growth-card');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      const counter = el.querySelector('[data-count-to]');
      if (counter && !reduceMotion) countUp(counter);
      observer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(el => observer.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-in'));
}
