const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'workshop');
const OUT = path.join(ROOT, 'assets', 'data', 'workshop-records.json');

/*
 * ============================================================
 * WORKSHOP RECORDS CMS DATA BUILDER
 * ============================================================
 *
 * Converte:
 *
 * content/workshop/*.md
 *
 * em:
 *
 * assets/data/workshop-records.json
 *
 * Compatível com o formato gerado pelo Pages CMS,
 * incluindo valores YAML multilinha com:
 *
 *   >-
 *   |-
 *   >
 *   |
 *
 * Também suporta:
 *
 * - title
 * - subtitle
 * - excerpt
 * - year
 * - status
 * - hero
 * - quote
 * - introduction
 * - construction_note
 * - conclusion
 * - instruments
 * - before_images
 * - workshop_images
 * - after_images
 *
 * E continua compatível com registros antigos que
 * utilizam seções Markdown:
 *
 * ## 01 — Título
 * Texto...
 *
 * ============================================================
 */


/* ============================================================
   YAML HELPERS
   ============================================================ */

function scalar(value) {
  value = String(value ?? '').trim();

  if (!value) {
    return '';
  }

  /*
   * Remove aspas externas.
   */
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}


/*
 * Normaliza texto multilinha do YAML.
 *
 * Exemplo:
 *
 * >-
 *   Uma linha
 *
 *   Outra linha
 *
 * vira:
 *
 * "Uma linha\n\nOutra linha"
 */
function normalizeBlock(lines, folded) {
  const cleaned = lines.map(line => {
    /*
     * Remove somente a indentação YAML.
     */
    return line.replace(/^\s{2}/, '');
  });

  if (!folded) {
    return cleaned.join('\n').trim();
  }

  /*
   * YAML folded scalar:
   *
   * linhas normais -> espaço
   * linhas separadas por linha vazia -> parágrafo
   */
  const paragraphs = [];
  let current = [];

  for (const line of cleaned) {
    if (!line.trim()) {
      if (current.length) {
        paragraphs.push(current.join(' ').trim());
        current = [];
      }
    } else {
      current.push(line.trim());
    }
  }

  if (current.length) {
    paragraphs.push(current.join(' ').trim());
  }

  return paragraphs.join('\n\n').trim();
}


/* ============================================================
   FRONTMATTER PARSER
   ============================================================ */

function parseFrontmatter(text) {

  const match = text.match(
    /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  );

  if (!match) {
    return {
      data: {},
      body: text.trim()
    };
  }

  const frontmatter = match[1];
  const body = match[2].trim();

  const lines = frontmatter.split(/\r?\n/);

  const data = {};

  let i = 0;

  while (i < lines.length) {

    const line = lines[i];

    /*
     * Ignora linhas vazias.
     */
    if (!line.trim()) {
      i++;
      continue;
    }

    /*
     * Ignora comentários.
     */
    if (/^\s*#/.test(line)) {
      i++;
      continue;
    }

    /*
     * Detecta chave YAML.
     */
    const keyMatch = line.match(
      /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/
    );

    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    let value = keyMatch[2] ?? '';

    /*
     * --------------------------------------------------------
     * LISTAS
     * --------------------------------------------------------
     */

    if (value === '') {

      const next = lines[i + 1] || '';

      /*
       * Lista simples:
       *
       * before_images:
       *   - /media/a.jpg
       *   - /media/b.jpg
       */
      if (/^\s*-\s+/.test(next)) {

        const array = [];

        i++;

        while (i < lines.length) {

          const itemLine = lines[i];

          const itemMatch = itemLine.match(
            /^\s*-\s+(.*)$/
          );

          if (!itemMatch) {
            break;
          }

          const itemValue = itemMatch[1];

          /*
           * Objeto dentro de lista:
           *
           * instruments:
           *   - instrument: Cort
           *     services: Regulagem
           */
          const objectMatch = itemValue.match(
            /^([A-Za-z0-9_-]+):\s*(.*)$/
          );

          if (objectMatch) {

            const object = {};

            object[objectMatch[1]] =
              scalar(objectMatch[2]);

            i++;

            while (i < lines.length) {

              const subLine = lines[i];

              const subMatch = subLine.match(
                /^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/
              );

              if (!subMatch) {
                break;
              }

              object[subMatch[1]] =
                scalar(subMatch[2]);

              i++;
            }

            array.push(object);

          } else {

            array.push(
              scalar(itemValue)
            );

            i++;
          }
        }

        data[key] = array;

        continue;
      }

      /*
       * ------------------------------------------------------
       * EMPTY VALUE
       * ------------------------------------------------------
       *
       * Se não há lista nem valor,
       * simplesmente deixa como string vazia.
       */

      data[key] = '';

      i++;

      continue;
    }


    /*
     * --------------------------------------------------------
     * MULTILINE YAML
     * --------------------------------------------------------
     *
     * >-
     * >
     * |-
     * |
     */

    if (
      value === '>-' ||
      value === '>' ||
      value === '|-' ||
      value === '|'
    ) {

      const folded =
        value === '>-' ||
        value === '>';

      const blockLines = [];

      i++;

      while (i < lines.length) {

        const current = lines[i];

        /*
         * Nova chave YAML no nível superior.
         */
        if (
          /^\S[A-Za-z0-9_-]*:\s*/.test(current)
        ) {
          break;
        }

        blockLines.push(current);

        i++;
      }

      data[key] =
        normalizeBlock(
          blockLines,
          folded
        );

      continue;
    }


    /*
     * --------------------------------------------------------
     * SCALAR NORMAL
     * --------------------------------------------------------
     */

    data[key] = scalar(value);

    i++;
  }

  return {
    data,
    body
  };
}


/* ============================================================
   MARKDOWN SECTIONS
   ============================================================ */

function parseSections(body) {

  if (!body) {
    return [];
  }

  const lines =
    body.split(/\r?\n/);

  const sections = [];

  let current = null;

  for (const line of lines) {

    /*
     * Detecta:
     *
     * ## 01 — O case
     *
     * ## Introdução
     */

    const heading =
      line.match(/^##\s+(.*)$/);

    if (heading) {

      if (current) {
        sections.push(current);
      }

      current = {
        heading: heading[1].trim(),
        body: []
      };

      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections.map(section => ({
    heading: section.heading,
    body: section.body.join('\n').trim()
  }));
}


/* ============================================================
   CMS FIELDS → SECTIONS
   ============================================================ */

/*
 * O Pages CMS atual utiliza campos:
 *
 * introduction
 * construction_note
 * conclusion
 *
 * Quando não existem seções Markdown,
 * transformamos esses campos em seções compatíveis
 * com o layout original do Workshop Record.
 */

function buildSections(data, body) {

  /*
   * Primeiro tenta usar as seções Markdown.
   *
   * Isso mantém compatibilidade com AG-WR-001.
   */

  const markdownSections =
    parseSections(body);

  if (markdownSections.length) {
    return markdownSections;
  }


  /*
   * Caso não existam seções Markdown,
   * usamos os campos do Pages CMS.
   */

  const sections = [];


  if (data.introduction) {

    sections.push({
      heading: '01 — Introdução',
      body: String(data.introduction).trim()
    });
  }


  if (data.construction_note) {

    sections.push({
      heading: '02 — Observação de construção',
      body: String(data.construction_note).trim()
    });
  }


  if (data.conclusion) {

    sections.push({
      heading: '03 — Conclusão',
      body: String(data.conclusion).trim()
    });
  }


  return sections;
}


/* ============================================================
   RECORD BUILDER
   ============================================================ */

function buildRecord(file) {

  const filePath =
    path.join(
      CONTENT_DIR,
      file
    );

  const raw =
    fs.readFileSync(
      filePath,
      'utf8'
    );

  const parsed =
    parseFrontmatter(raw);

  const data =
    parsed.data;


  /*
   * Arquivo sem ref não é um registro válido.
   */
  if (!data.ref) {
    return null;
  }


  /*
   * Somente registros publicados.
   *
   * Se status não existir, assume published
   * para manter compatibilidade com AG-WR-001.
   */

  const status =
    String(
      data.status ?? 'published'
    )
      .trim()
      .toLowerCase();

  if (status !== 'published') {
    return null;
  }


  /*
   * Monta as seções.
   */
  const sections =
    buildSections(
      data,
      parsed.body
    );


  /*
   * Retorna estrutura pública.
   */

  return {

    ref:
      String(data.ref),

    title:
      String(data.title ?? ''),

    subtitle:
      String(data.subtitle ?? ''),

    year:
      data.year ?? '',

    excerpt:
      String(data.excerpt ?? ''),

    hero:
      String(data.hero ?? ''),

    instruments:
      Array.isArray(data.instruments)
        ? data.instruments
        : [],

    before_images:
      Array.isArray(data.before_images)
        ? data.before_images
        : [],

    workshop_images:
      Array.isArray(data.workshop_images)
        ? data.workshop_images
        : [],

    after_images:
      Array.isArray(data.after_images)
        ? data.after_images
        : [],

    quote:
      String(data.quote ?? ''),

    sections,

    source:
      `content/workshop/${file}`
  };
}


/* ============================================================
   MAIN
   ============================================================ */

if (!fs.existsSync(CONTENT_DIR)) {

  console.log(
    'Workshop content directory not found; nothing to build.'
  );

  fs.mkdirSync(
    path.dirname(OUT),
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt:
          new Date().toISOString(),

        records: []
      },
      null,
      2
    ) + '\n'
  );

  process.exit(0);
}


/*
 * Busca todos os Markdown do Workshop.
 */

const files =
  fs.readdirSync(
    CONTENT_DIR
  )
  .filter(
    file => /\.md$/i.test(file)
  );


const records = [];


for (const file of files) {

  try {

    const record =
      buildRecord(file);

    if (record) {
      records.push(record);
    }

  } catch (error) {

    console.error(
      `Error processing ${file}:`,
      error
    );
  }
}


/*
 * Ordenação:
 *
 * AG-WR-002
 * AG-WR-001
 *
 * Mais recente primeiro.
 */

records.sort(
  (a, b) =>
    String(b.ref).localeCompare(
      String(a.ref),
      undefined,
      {
        numeric: true
      }
    )
);


/*
 * Cria diretório de saída.
 */

fs.mkdirSync(
  path.dirname(OUT),
  {
    recursive: true
  }
);


/*
 * Gera JSON público.
 */

const output = {

  generatedAt:
    new Date().toISOString(),

  records
};


fs.writeFileSync(
  OUT,
  JSON.stringify(
    output,
    null,
    2
  ) + '\n'
);


console.log(
  `Workshop Records: ${records.length} published record(s) written to ${path.relative(ROOT, OUT)}`
);