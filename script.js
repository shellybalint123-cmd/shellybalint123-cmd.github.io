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

function enableVideoSound(video) {
  video.removeAttribute('muted');
  video.defaultMuted = false;
  video.muted = false;
  video.volume = 1;
}

document.querySelectorAll('video').forEach(video => {
  enableVideoSound(video);

  ['click', 'pointerdown', 'touchstart', 'loadedmetadata', 'canplay'].forEach(eventName => {
    video.addEventListener(eventName, () => enableVideoSound(video), { passive: true });
  });

  video.addEventListener('volumechange', () => {
    if (video.muted || video.volume === 0) {
      enableVideoSound(video);
    }
  });

  video.addEventListener('play', () => {
    enableVideoSound(video);

    document.querySelectorAll('video').forEach(otherVideo => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });
  });
});
