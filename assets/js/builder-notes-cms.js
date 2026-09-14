/* ============================================================
   BUILDER'S NOTES · CMS PHOTOGRAPHY LOADER
   Generic loader shared by AG-BN-001 through AG-BN-004.

   Mapping:
   Plate 01 <- hero
   Plate 02 <- image_02
   Plate 03 <- image_03
   Plate 04 <- image_04

   image_05 and image_06 remain available in Pages CMS for future
   layout extensions without changing the current record design.
   ============================================================ */
(function () {
  const body = document.body;
  if (!body || !body.classList.contains('record-page')) return;

  const ref = body.getAttribute('data-record-ref');
  if (!/^AG-BN-\d{3}$/.test(ref || '')) return;

  const source = 'https://raw.githubusercontent.com/AlexandreGuitars/alexandre-guitars-archive/main/content/builders-notes/' + ref + '.md';
  const keys = ['hero', 'image_02', 'image_03', 'image_04'];
  const plates = Array.from(document.querySelectorAll('.record-section .record-plate'));

  function extractImage(markdown, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?:^|\\n)\\s*' + escaped + ':\\s*\\n\\s*image:\\s*["\\']?([^"\\'\\s]+)', 'm');
    const match = markdown.match(re);
    if (!match) return null;

    const value = match[1].trim();
    if (value.startsWith('/media/') || value.startsWith('https://') || value.startsWith('http://')) {
      return value;
    }
    return null;
  }

  function loadImage(plate, key, url) {
    if (!plate || !url) return;

    plate.classList.add('cms-photo-ready');

    const image = document.createElement('img');
    image.className = 'cms-record-image';
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';

    const placeholder = plate.querySelector('span');
    if (placeholder) placeholder.classList.add('record-placeholder-label');

    const caption = document.createElement('span');
    caption.className = 'cms-record-caption';
    caption.textContent = placeholder ? placeholder.textContent.trim() : '';

    image.addEventListener('load', function () {
      plate.classList.add('cms-photo-loaded');
      if (caption.textContent) plate.appendChild(caption);
    }, { once: true });

    image.addEventListener('error', function () {
      image.remove();
      caption.remove();
      plate.classList.remove('cms-photo-loaded');
    }, { once: true });

    image.src = url;
    plate.insertBefore(image, plate.firstChild);
  }

  fetch(source + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('CMS content unavailable: ' + response.status);
      return response.text();
    })
    .then(function (markdown) {
      keys.forEach(function (key, index) {
        const url = extractImage(markdown, key);
        if (url && plates[index]) loadImage(plates[index], key, url);
      });
    })
    .catch(function (error) {
      console.warn('Archive Builder\'s Notes: using original photo placeholders.', error);
    });
})();
