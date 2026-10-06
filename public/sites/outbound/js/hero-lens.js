/* A visitor-controlled window onto three kinds of wilderness. */
(() => {
  const media = document.querySelector('.hero-media');
  const lens = document.querySelector('.terrain-lens');
  if (!media || !lens) return;
  const scenes = {
    alpine: { file: 'hero-ridge', width: 1800, label: '01 / Alpine', alt: 'Snow-covered mountain peaks rising above a sea of cloud at sunrise.' },
    river: { file: 'mirror-lake', width: 1600, label: '02 / River', alt: 'A shallow river winding through pine forest beneath distant cliffs.' },
    coast: { file: 'tide-beach', width: 1600, label: '03 / Coast', alt: 'Gentle waves washing onto a pale sandy beach at sunrise.' }
  };
  let selected = 'alpine', request = 0;
  const buttons = [...lens.querySelectorAll('button')];
  const caption = lens.querySelector('.terrain-caption');
  buttons.forEach(button => button.addEventListener('click', async () => {
    const key = button.dataset.terrain;
    if (key === selected) { request++; lens.removeAttribute('aria-busy'); return; }
    const token = ++request, scene = scenes[key];
    lens.setAttribute('aria-busy', 'true');
    const picture = media.querySelector('.hero-shot.is-active').cloneNode(true);
    picture.classList.remove('is-active');
    picture.setAttribute('aria-hidden', 'true');
    const source = picture.querySelector('source'), img = picture.querySelector('img');
    source.srcset = [640, 1280, scene.width].map(w => `images/${scene.file}-${w}.webp ${w}w`).join(', ');
    img.removeAttribute('fetchpriority');
    img.src = `images/${scene.file}.jpg`;
    img.alt = scene.alt;
    img.width = scene.width;
    img.removeAttribute('height');
    media.append(picture);
    try { await img.decode(); } catch (_) { picture.remove(); if (token === request) { lens.removeAttribute('aria-busy'); caption.textContent = 'Try another landscape'; } return; }
    if (token !== request) { picture.remove(); return; }
    const previous = media.querySelector('.hero-shot.is-active');
    selected = key;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    caption.textContent = scene.label;
    lens.removeAttribute('aria-busy');
    requestAnimationFrame(() => {
      picture.classList.add('is-active');
      picture.removeAttribute('aria-hidden');
      previous.classList.remove('is-active');
      previous.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => previous.remove(), 800);
    });
  }));
})();
