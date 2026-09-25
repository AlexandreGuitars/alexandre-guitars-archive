/* Builder's Notes CMS image loader — shared across all AG-BN records. */
(function () {
  'use strict';

  const body = document.body;
  if (!body || !body.classList.contains('record-page')) return;

  /*
   * Prefer an explicit data-record-ref when present.
   * Otherwise derive AG-BN-XXX from the record filename:
   * 001-jeff-beck.html -> AG-BN-001
   */
  const explicitRef = body.getAttribute('data-record-ref');
  const filenameMatch = window.location.pathname.match(
    /\/([0-9]{3})-[^/]+\.html$/i
  );

  const ref = /^AG-BN-\d{3}$/.test(explicitRef || '')
    ? explicitRef
    : (filenameMatch ? 'AG-BN-' + filenameMatch[1] : '');

  if (!/^AG-BN-\d{3}$/.test(ref)) {
    console.warn("Builder's Notes CMS: referência inválida.", ref);
    return;
  }

  const DATA_URL = '../../assets/data/builders-notes.json?t=' + Date.now();
  const keys = [
    'hero',
    'image_02',
    'image_03',
    'image_04',
    'image_05',
    'image_06'
  ];

  /*
   * Every original record page already uses .record-plate.
   * No special cms-photo-ready class is required.
   */
  const plates = Array.from(
    document.querySelectorAll('.record-section .record-plate')
  );

  if (!plates.length) {
    console.warn(
      "Builder's Notes CMS: nenhum .record-plate encontrado.",
      ref
    );
    return;
  }

  function normalizeImageEntry(entry) {
    if (!entry) return null;

    if (typeof entry === 'string') {
      return {
        image: entry,
        caption: ''
      };
    }

    if (typeof entry === 'object') {
      return {
        image: typeof entry.image === 'string' ? entry.image.trim() : '',
        caption: typeof entry.caption === 'string'
          ? entry.caption.trim()
          : ''
      };
    }

    return null;
  }

  function resolveImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') return null;

    const value = imagePath.trim();

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (value.startsWith('/media/')) {
      return '../..' + value;
    }

    if (value.startsWith('media/')) {
      return '../../' + value;
    }

    return null;
  }

  function insertImage(plate, entry, key) {
    const normalized = normalizeImageEntry(entry);
    if (!plate || !normalized || !normalized.image) return;

    const imageUrl = resolveImageUrl(normalized.image);

    if (!imageUrl) {
      console.warn(
        "Builder's Notes CMS: caminho de imagem inválido:",
        normalized.image
      );
      return;
    }

    const oldImage = plate.querySelector('.cms-record-image');
    const oldCaption = plate.querySelector('.cms-record-caption');

    if (oldImage) oldImage.remove();
    if (oldCaption) oldCaption.remove();

    const placeholder = plate.querySelector('span:not(.cms-record-caption)');

    if (placeholder) {
      placeholder.classList.add('record-placeholder-label');
    }

    const image = document.createElement('img');
    image.className = 'cms-record-image';
    image.alt = '';
    image.loading = 'eager';
    image.decoding = 'async';

    const caption = document.createElement('span');
    caption.className = 'cms-record-caption';

    /*
     * Use the CMS caption when available.
     * If the CMS has no caption yet, preserve the original
     * editorial placeholder text instead.
     */
    caption.textContent =
      normalized.caption ||
      (placeholder ? placeholder.textContent.trim() : '');

    image.addEventListener('load', function () {
      plate.classList.add('cms-photo-loaded');

      if (placeholder) {
        placeholder.style.display = 'none';
      }

      if (caption.textContent) {
        plate.appendChild(caption);
      }

      console.log(
        "Builder's Notes CMS: imagem carregada:",
        ref,
        key,
        imageUrl
      );
    }, { once: true });

    image.addEventListener('error', function () {
      console.error(
        "Builder's Notes CMS: não foi possível carregar:",
        ref,
        key,
        imageUrl
      );

      image.remove();
      caption.remove();
      plate.classList.remove('cms-photo-loaded');

      if (placeholder) {
        placeholder.style.display = '';
      }
    }, { once: true });

    plate.insertBefore(image, plate.firstChild);
    image.src = imageUrl;
  }

  fetch(DATA_URL, {
    method: 'GET',
    cache: 'no-store'
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          'HTTP ' + response.status + ' ao carregar ' + DATA_URL
        );
      }

      return response.json();
    })
    .then(function (records) {
      const record = records && records[ref];

      if (!record) {
        console.warn(
          "Builder's Notes CMS: registro não encontrado:",
          ref
        );
        return;
      }

      keys.forEach(function (key, index) {
        if (record[key] && plates[index]) {
          insertImage(plates[index], record[key], key);
        }
      });
    })
    .catch(function (error) {
      console.warn(
        "Builder's Notes CMS: não foi possível carregar as imagens. " +
        "Os placeholders permanecem.",
        error
      );
    });
})();
