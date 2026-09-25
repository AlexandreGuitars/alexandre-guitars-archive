const fs = require('fs');
const path = require('path');

const contentDir = path.join(process.cwd(), 'content', 'builders-notes');
const outputFile = path.join(
  process.cwd(),
  'assets',
  'data',
  'builders-notes.json'
);

const keys = [
  'hero',
  'image_02',
  'image_03',
  'image_04',
  'image_05',
  'image_06'
];

function getIndent(line) {
  return line.length - line.trimStart().length;
}

function extractImageEntry(markdown, key) {
  const lines = markdown.split(/\r?\n/);

  let insideImages = false;
  let insideKey = false;
  let keyIndent = -1;

  let image = null;
  let caption = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = getIndent(line);

    if (trimmed === 'images:') {
      insideImages = true;
      insideKey = false;
      keyIndent = -1;
      continue;
    }

    if (!insideImages) continue;

    if (trimmed === '---') break;

    /*
     * A new image key at the same indentation ends
     * the previous image block.
     */
    const keyMatch = line.match(/^\s*(hero|image_\d{2}):\s*$/);

    if (keyMatch) {
      if (keyMatch[1] === key) {
        insideKey = true;
        keyIndent = indent;
        image = null;
        caption = null;
      } else if (insideKey && indent <= keyIndent) {
        insideKey = false;
      }

      continue;
    }

    if (!insideKey) continue;

    if (indent <= keyIndent && trimmed.endsWith(':')) {
      insideKey = false;
      continue;
    }

    const imageMatch = line.match(
      /^\s*image:\s*["']?([^"'\s]+)["']?\s*$/
    );

    if (imageMatch && image === null) {
      image = imageMatch[1].trim();
      continue;
    }

    const captionMatch = line.match(
      /^\s*caption:\s*(.*)$/
    );

    if (captionMatch && caption === null) {
      caption = captionMatch[1]
        .trim()
        .replace(/^['"]|['"]$/g, '');
      continue;
    }
  }

  /*
   * Compatibility with the older flat structure:
   *
   * hero: /media/file.jpg
   * image_02: /media/file.jpg
   */
  if (!image) {
    const escapedKey = key.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const legacyPattern = new RegExp(
      '^\\s*' +
        escapedKey +
        ':\\s*["\']?([^"\'\\s]+)["\']?\\s*$',
      'm'
    );

    const legacyMatch = markdown.match(legacyPattern);

    if (legacyMatch) {
      image = legacyMatch[1].trim();
    }
  }

  if (!image) return null;

  return {
    image,
    caption: caption || ''
  };
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
    const entry = extractImageEntry(markdown, key);

    if (entry && isAllowedImage(entry.image)) {
      record[key] = {
        image: entry.image,
        caption: entry.caption
      };
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
