document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.video-card').forEach(card => {
  const video = card.querySelector('video');

  card.addEventListener('click', () => {
    if (video.paused) {
      video.controls = true;
      video.play()
        .then(() => card.classList.add('is-playing'))
        .catch(() => {});
    } else {
      video.pause();
    }
  });

  video.addEventListener('pause', () => card.classList.remove('is-playing'));
  video.addEventListener('ended', () => {
    card.classList.remove('is-playing');
    video.controls = false;
  });
});
