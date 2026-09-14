const fs = require('fs');
const path = require('path');

const contentDir = path.join(process.cwd(), 'content', 'builders-notes');
const outputFile = path.join(process.cwd(), 'assets', 'data', 'builders-notes.json');

const keys = [
  'hero',
  'image_02',
  'image_03',
  'image_04',
  'image_05',
  'image_06'
];

function extractImage(markdown, key) {
  const lines = markdown.split(/\r?\n/);

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keyPattern = new RegExp(
    '^\\s*' + escapedKey + ':\\s*$'
  );

  /*
    Estrutura atual do Pages CMS:

    images:
      hero:
        image: /media/file.jpg
      image_02:
        image: /media/file.jpg
  */

  let insideImages = false;
  let insideKey = false;
  let keyIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    if (trimmed === 'images:') {
      insideImages = true;
      insideKey = false;
      keyIndent = -1;
      continue;
    }

    if (!insideImages) continue;

    if (trimmed === '---') break;

    if (keyPattern.test(line)) {
      insideKey = true;
      keyIndent = indent;
      continue;
    }

    if (insideKey) {
      /*
        Se encontramos outra chave no mesmo nível,
        encerramos a leitura da chave atual.
      */
      if (indent <= keyIndent && trimmed.endsWith(':')) {
        insideKey = false;
        continue;
      }

      const match = line.match(
        /^\s*image:\s*["']?([^"'\s]+)["']?\s*$/
      );

      if (match) {
        return match[1].trim();
      }
    }
  }

  /*
    Compatibilidade com estrutura antiga:

    hero: /media/file.jpg
    image_02: /media/file.jpg
  */

  const legacyPattern = new RegExp(
    '^\\s*' +
      escapedKey +
      ':\\s*["\']?([^"\'\\s]+)["\']?\\s*$',
    'm'
  );

  const legacyMatch = markdown.match(legacyPattern);

  return legacyMatch ? legacyMatch[1].trim() : null;
}

function isAllowedImage(value) {
  return (
    typeof value === 'string' &&
    (
      /^https?:\/\//i.test(value) ||
      value.startsWith('/media/') ||
      value.startsWith('media/')
    )
  );
}

if (!fs.existsSync(contentDir)) {
  throw new Error(
    `Diretório não encontrado: ${contentDir}`
  );
}

const output = {};

const files = fs
  .readdirSync(contentDir)
  .filter(name => /^AG-BN-\d{3}\.md$/.test(name))
  .sort();

for (const filename of files) {
  const markdown = fs.readFileSync(
    path.join(contentDir, filename),
    'utf8'
  );

  const ref = filename.replace(/\.md$/, '');

  const record = {};

  for (const key of keys) {
    const image = extractImage(markdown, key);

    if (isAllowedImage(image)) {
      record[key] = image;
    }
  }

  output[ref] = record;
}

fs.mkdirSync(
  path.dirname(outputFile),
  { recursive: true }
);

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2) + '\n',
  'utf8'
);

console.log(`Generated ${outputFile}`);
console.log(JSON.stringify(output, null, 2));