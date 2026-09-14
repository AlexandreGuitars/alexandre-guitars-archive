(function () {
  'use strict';

  const body = document.body;
  if (!body || !body.classList.contains('record-page')) return;

  const ref = body.getAttribute('data-record-ref');
  if (!/^AG-BN-\d{3}$/.test(ref || '')) {
    console.warn('Builder Notes CMS: referência inválida.', ref);
    return;
  }

  const dataUrl = '../../assets/data/builders-notes.json?t=' + Date.now();
  const keys = ['hero', 'image_02', 'image_03', 'image_04'];
  const plates = Array.from(
    document.querySelectorAll('.record-section .record-plate.cms-photo-ready')
  );

  if (!plates.length) {
    console.warn('Builder Notes CMS: nenhuma área .record-plate.cms-photo-ready encontrada.');
    return;
  }

  function resolveImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') return null;
    const value = imagePath.trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/media/')) return '../..' + value;
    if (value.startsWith('media/')) return '../../' + value;
    return null;
  }

  function insertImage(plate, imagePath, key) {
    if (!plate || !imagePath) return;

    const imageUrl = resolveImageUrl(imagePath);
    if (!imageUrl) {
      console.warn('Builder Notes CMS: caminho de imagem inválido:', imagePath);
      return;
    }

    const oldImage = plate.querySelector('.cms-record-image');
    if (oldImage) oldImage.remove();

    const placeholder = plate.querySelector('span');
    if (placeholder) placeholder.classList.add('record-placeholder-label');

    const image = document.createElement('img');
    image.className = 'cms-record-image';
    image.alt = '';
    image.loading = 'eager';
    image.decoding = 'async';

    const caption = document.createElement('span');
    caption.className = 'cms-record-caption';
    caption.textContent = placeholder ? placeholder.textContent.trim() : '';

    image.addEventListener('load', function () {
      plate.classList.add('cms-photo-loaded');
      if (placeholder) placeholder.style.display = 'none';
      if (caption.textContent && !plate.contains(caption)) plate.appendChild(caption);
      console.log('Builder Notes CMS: imagem carregada:', ref, key, imageUrl);
    }, { once: true });

    image.addEventListener('error', function () {
      console.error('Builder Notes CMS: não foi possível carregar:', imageUrl);
      image.remove();
      caption.remove();
      plate.classList.remove('cms-photo-loaded');
      if (placeholder) placeholder.style.display = '';
    }, { once: true });

    plate.insertBefore(image, plate.firstChild);
    image.src = imageUrl;
  }

  fetch(dataUrl, { method: 'GET', cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' ao carregar ' + dataUrl);
      return response.json();
    })
    .then(function (records) {
      const record = records && records[ref];
      if (!record) {
        console.warn('Builder Notes CMS: registro não encontrado no JSON:', ref);
        return;
      }

      keys.forEach(function (key, index) {
        if (record[key] && plates[index]) insertImage(plates[index], record[key], key);
      });
    })
    .catch(function (error) {
      console.error('Builder Notes CMS: erro ao carregar dados públicos de imagens.', error);
    });
})();
