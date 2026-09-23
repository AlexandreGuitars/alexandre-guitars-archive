(function () {
  'use strict';

  const isRecord = !!document.querySelector('[data-workshop-record]');
  const DATA_URL = isRecord ? '../../assets/data/workshop-records.json' : '../assets/data/workshop-records.json';

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const inline = (value) => esc(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const media = (src) => {
    if (!src) return '';
    if (/^(https?:|data:|\/\/)/i.test(src)) return src;
    return src.startsWith('/') ? (isRecord ? '../..' + src : '..' + src) : src;
  };

  const paragraphs = (text) => String(text || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${inline(p.replace(/\n/g, ' '))}</p>`)
    .join('');

  const gallery = (images, label) => {
    if (!Array.isArray(images) || !images.length) return '';
    return `<div class="workshop-gallery">${images.map((src, i) => `
      <figure>
        <img src="${esc(media(src))}" alt="${esc(label)} · ${i + 1}">
        <figcaption>${esc(label)} · ${String(i + 1).padStart(2, '0')}</figcaption>
      </figure>`).join('')}</div>`;
  };

  const sectionLabel = (heading) => {
    const parts = String(heading || '').split('—');
    return esc((parts[0] || heading).trim());
  };

  const sectionTitle = (heading) => {
    const parts = String(heading || '').split('—');
    return esc((parts.slice(1).join('—') || heading).trim());
  };

  function renderList(records) {
    const target = document.querySelector('[data-workshop-list]');
    if (!target) return;
    if (!records.length) {
      target.innerHTML = '<p class="cms-empty">Nenhum Workshop Record publicado.</p>';
      return;
    }
    target.innerHTML = records.map((r, i) => `
      <a class="collection-item" href="../records/workshop/index.html?ref=${encodeURIComponent(r.ref)}">
        <div class="collection-number">${String(i + 1).padStart(2, '0')}</div>
        <div>
          <p class="collection-code">${esc(r.ref)} · ${esc(r.year)}</p>
          <h2 class="collection-title">${esc(r.title)}</h2>
          <p class="collection-desc">${esc(r.excerpt || r.subtitle)}</p>
        </div>
        <div class="collection-arrow">→</div>
      </a>`).join('');
    const count = document.querySelector('[data-workshop-count]');
    if (count) count.textContent = String(records.length).padStart(2, '0');
  }

  function renderRecord(record, all) {
    const target = document.querySelector('[data-workshop-record]');
    if (!target || !record) return;

    document.title = `${record.ref} — ${record.title} — Alexandre Guitars Archive`;
    const sections = Array.isArray(record.sections) ? record.sections : [];

    const sectionsHtml = sections.map((s, i) => {
      let extra = '';
      if (i === 0 && record.hero) {
        extra += `<figure class="workshop-photo"><img src="${esc(media(record.hero))}" alt="${esc(record.title)}"><figcaption>${esc(record.ref)} · registro principal</figcaption></figure>`;
      }
      if (i === 0 && Array.isArray(record.instruments) && record.instruments.length) {
        extra += `<div class="workshop-specs">${record.instruments.map(item => `
          <div class="workshop-spec"><strong>${esc(item.instrument || 'Instrumento')}</strong><span>${esc(item.services || '')}</span></div>`).join('')}</div>`;
      }
      if (i === 2) extra += gallery(record.before_images, 'Antes');
      if (i === 3) extra += gallery(record.workshop_images, 'Oficina');
      if (i === 4) extra += gallery(record.after_images, 'Depois');

      return `<section class="record-section">
        <div class="record-no">${String(i + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}</div>
        <div class="record-section-main">
          <p class="section-label">${sectionLabel(s.heading)}</p>
          <h2>${sectionTitle(s.heading)}</h2>
          ${paragraphs(s.body)}
          ${extra}
        </div>
      </section>`;
    }).join('');

    const currentIndex = all.findIndex(r => r.ref === record.ref);
    const previous = all[currentIndex + 1];
    const next = all[currentIndex - 1];

    target.innerHTML = `
      <section class="record-hero">
        <div>
          <div class="record-kicker">${esc(record.ref)} · oficina · ${esc(record.year)}</div>
          <h1 class="record-title">${esc(record.title)}</h1>
          <p class="record-subtitle">${esc(record.subtitle)}</p>
        </div>
        <aside class="record-index">
          <p class="meta-label">Collection</p><p class="meta-value">Workshop Records</p>
          <p class="meta-label">Archive ID</p><p class="meta-value">${esc(record.ref)}</p>
          <p class="meta-label">Year</p><p class="meta-value">${esc(record.year)}</p>
          <div class="record-mark">Alexandre Guitars · São Paulo</div>
        </aside>
      </section>
      <div class="record-body">
        ${sectionsHtml}
        ${record.quote ? `<section class="record-quote"><p>“${inline(record.quote)}”</p><small>${esc(record.ref)} · Workshop Records</small></section>` : ''}
        <nav class="record-nav" aria-label="Navegação entre registros">
          ${previous ? `<a class="collection" href="?ref=${encodeURIComponent(previous.ref)}">← Anterior<br>${esc(previous.ref)}</a>` : '<span></span>'}
          <a class="collection" href="../../series/workshop-records.html">Collection<br>Workshop Records</a>
          ${next ? `<a class="collection" href="?ref=${encodeURIComponent(next.ref)}">Próximo →<br>${esc(next.ref)}</a>` : '<span></span>'}
        </nav>
      </div>`;
  }

  fetch(DATA_URL, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(payload => {
      const records = Array.isArray(payload) ? payload : (payload.records || []);
      if (!isRecord) renderList(records);
      else {
        const ref = new URLSearchParams(window.location.search).get('ref') || records[0]?.ref;
        const record = records.find(r => r.ref === ref);
        if (record) renderRecord(record, records);
        else {
          const target = document.querySelector('[data-workshop-record]');
          if (target) target.innerHTML = '<div class="archive-note"><p class="archive-note-text">Registro não encontrado ou ainda não publicado.</p></div>';
        }
      }
    })
    .catch(error => {
      console.error('Workshop Records CMS:', error);
      const target = document.querySelector(isRecord ? '[data-workshop-record]' : '[data-workshop-list]');
      if (target) target.innerHTML = '<div class="archive-note"><p class="archive-note-text">Não foi possível carregar os registros neste momento.</p></div>';
    });
})();
