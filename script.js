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

  const soundButton = document.createElement('button');
  soundButton.className = 'video-sound-button';
  soundButton.type = 'button';
  soundButton.textContent = 'הפעל סאונד';
  soundButton.setAttribute('aria-label', 'הפעלת הסרטון עם סאונד');

  const videoParent = video.parentElement;
  if (videoParent && !videoParent.querySelector('.video-sound-button')) {
    videoParent.appendChild(soundButton);
  }

  soundButton.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    enableVideoSound(video);

    try {
      await video.play();
      soundButton.classList.add('is-hidden');
    } catch (error) {
      soundButton.classList.remove('is-hidden');
    }
  });

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
    soundButton.classList.add('is-hidden');

    document.querySelectorAll('video').forEach(otherVideo => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });
  });

  video.addEventListener('pause', () => {
    soundButton.classList.remove('is-hidden');
  });
});
