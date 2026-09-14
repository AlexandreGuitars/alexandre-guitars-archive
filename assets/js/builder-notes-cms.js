/* ============================================================
   BUILDER'S NOTES · CMS PHOTOGRAPHY LOADER
   Alexandre Guitars Archive

   CMS mapping:
   Plate 01 <- images.hero
   Plate 02 <- images.image_02
   Plate 03 <- images.image_03
   Plate 04 <- images.image_04

   O conteúdo é carregado pelo próprio domínio do Archive.
   Não depende de raw.githubusercontent.com.
   ============================================================ */

(function () {
  'use strict';

  const body = document.body;

  if (!body) return;

  if (!body.classList.contains('record-page')) {
    return;
  }

  const ref = body.getAttribute('data-record-ref');

  if (!/^AG-BN-\d{3}$/.test(ref || '')) {
    console.warn('Builder Notes CMS: referência inválida.', ref);
    return;
  }

  /*
   * IMPORTANTE:
   * O HTML está dentro de:
   *
   * /records/builders-notes/
   *
   * Portanto, ../.. leva ao root do Archive.
   */

  const contentUrl =
    '../../content/builders-notes/' +
    ref +
    '.md?t=' +
    Date.now();

  const keys = [
    'hero',
    'image_02',
    'image_03',
    'image_04'
  ];

  const plates = Array.from(
    document.querySelectorAll(
      '.record-section .record-plate.cms-photo-ready'
    )
  );

  if (!plates.length) {
    console.warn(
      'Builder Notes CMS: nenhuma área .record-plate.cms-photo-ready encontrada.'
    );
    return;
  }

  /*
   * ------------------------------------------------------------
   * EXTRAI UMA IMAGEM DO FRONTMATTER DO PAGES CMS
   *
   * Exemplo:
   *
   * images:
   *   hero:
   *     image: /media/alexandre-1.png
   *
   *   image_02:
   *     image: /media/alexandre.png
   * ------------------------------------------------------------
   */

  function extractImage(markdown, key) {

    if (!markdown || !key) {
      return null;
    }

    const escapedKey = key.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const pattern =
      '(?:^|\\n)' +
      '\\s*' +
      escapedKey +
      ':\\s*\\n' +
      '\\s*image:\\s*[\'"]?([^\'"\\s]+)';

    const regex = new RegExp(pattern, 'm');

    const match = markdown.match(regex);

    if (!match) {
      console.warn(
        'Builder Notes CMS: imagem não encontrada para',
        key
      );

      return null;
    }

    let value = match[1].trim();

    /*
     * Remove aspas eventualmente presentes.
     */

    value = value.replace(/^['"]|['"]$/g, '');

    if (!value) {
      return null;
    }

    return value;
  }

  /*
   * ------------------------------------------------------------
   * CONVERTE O CAMINHO DO CMS EM UMA URL DO ARCHIVE
   * ------------------------------------------------------------
   */

  function resolveImageUrl(imagePath) {

    if (!imagePath) {
      return null;
    }

    /*
     * URL absoluta
     */

    if (
      imagePath.startsWith('https://') ||
      imagePath.startsWith('http://')
    ) {
      return imagePath;
    }

    /*
     * O Pages CMS salva:
     *
     * /media/imagem.jpg
     *
     * Como o record está dentro de:
     *
     * /records/builders-notes/
     *
     * precisamos transformar em:
     *
     * ../../media/imagem.jpg
     */

    if (imagePath.startsWith('/media/')) {

      return '../..' + imagePath;
    }

    /*
     * Caso o CMS tenha salvo sem a barra inicial.
     *
     * media/imagem.jpg
     */

    if (imagePath.startsWith('media/')) {

      return '../../' + imagePath;
    }

    return imagePath;
  }

  /*
   * ------------------------------------------------------------
   * CRIA A IMAGEM DENTRO DO RECORD-PLATE
   * ------------------------------------------------------------
   */

  function insertImage(plate, imagePath, key) {

    if (!plate || !imagePath) {
      return;
    }

    const imageUrl = resolveImageUrl(imagePath);

    if (!imageUrl) {
      return;
    }

    console.log(
      'Builder Notes CMS:',
      key,
      '→',
      imageUrl
    );

    /*
     * Evita duplicar imagens se o script for executado
     * novamente.
     */

    const existing =
      plate.querySelector('.cms-record-image');

    if (existing) {
      existing.remove();
    }

    /*
     * Guarda o texto original do placeholder.
     */

    const placeholder =
      plate.querySelector('span');

    if (placeholder) {

      placeholder.classList.add(
        'record-placeholder-label'
      );
    }

    /*
     * Cria a imagem.
     */

    const image =
      document.createElement('img');

    image.className =
      'cms-record-image';

    image.alt = '';

    image.loading = 'eager';

    image.decoding = 'async';

    /*
     * Caption usando o texto que já existia
     * no placeholder original.
     */

    const caption =
      document.createElement('span');

    caption.className =
      'cms-record-caption';

    caption.textContent =
      placeholder
        ? placeholder.textContent.trim()
        : '';

    /*
     * ----------------------------------------------------------
     * SUCESSO
     * ----------------------------------------------------------
     */

    image.addEventListener(
      'load',
      function () {

        console.log(
          'Builder Notes CMS: imagem carregada:',
          imageUrl
        );

        plate.classList.add(
          'cms-photo-loaded'
        );

        if (placeholder) {

          placeholder.style.display =
            'none';
        }

        /*
         * Adiciona a legenda apenas uma vez.
         */

        if (
          caption.textContent &&
          !plate.contains(caption)
        ) {

          plate.appendChild(caption);
        }

      },
      { once: true }
    );

    /*
     * ----------------------------------------------------------
     * ERRO
     * ----------------------------------------------------------
     */

    image.addEventListener(
      'error',
      function () {

        console.error(
          'Builder Notes CMS: NÃO FOI POSSÍVEL CARREGAR:',
          imageUrl
        );

        image.remove();

        caption.remove();

        plate.classList.remove(
          'cms-photo-loaded'
        );

        if (placeholder) {

          placeholder.style.display =
            '';
        }

      },
      { once: true }
    );

    /*
     * Coloca a imagem primeiro dentro do plate.
     */

    plate.insertBefore(
      image,
      plate.firstChild
    );

    /*
     * Finalmente define o src.
     */

    image.src = imageUrl;
  }

  /*
   * ------------------------------------------------------------
   * CARREGA O MARKDOWN DO CMS
   * ------------------------------------------------------------
   */

  console.log(
    'Builder Notes CMS: carregando conteúdo:',
    contentUrl
  );

  fetch(
    contentUrl,
    {
      method: 'GET',
      cache: 'no-store'
    }
  )

    .then(function (response) {

      if (!response.ok) {

        throw new Error(
          'HTTP ' +
          response.status +
          ' ao carregar ' +
          contentUrl
        );
      }

      return response.text();
    })

    .then(function (markdown) {

      console.log(
        'Builder Notes CMS: Markdown recebido para',
        ref
      );

      console.log(
        markdown
      );

      /*
       * Para cada uma das quatro áreas:
       *
       * hero
       * image_02
       * image_03
       * image_04
       */

      keys.forEach(
        function (key, index) {

          const imagePath =
            extractImage(
              markdown,
              key
            );

          if (
            imagePath &&
            plates[index]
          ) {

            insertImage(
              plates[index],
              imagePath,
              key
            );
          }

        }
      );

    })

    .catch(function (error) {

      console.error(
        'Builder Notes CMS: erro ao carregar imagens.',
        error
      );

      /*
       * Em caso de erro, mantém o HTML original.
       * Assim o Archive não fica quebrado.
       */

    });

})();