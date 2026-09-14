const fs = require('fs');
const path = require('path');

const contentDir = path.join(process.cwd(), 'content', 'builders-notes');
const outputFile = path.join(process.cwd(), 'assets', 'data', 'builders-notes.json');
const keys = ['hero', 'image_02', 'image_03', 'image_04', 'image_05', 'image_06'];

function extractImage(markdown, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Current Pages CMS structure:
  // images:
  //   image_02:
  //     image: /media/file.jpg
  const nested = new RegExp(
    '(?:^|\\n)\\s*' + escaped + ':\\s*\\n\\s*image:\\s*[\'\"]?([^\'\"\\s]+)',
    'm'
  ).exec(markdown);

  if (nested) return nested[1].trim();

  // Legacy/older Pages CMS structure:
  // hero: /media/file.jpg
  const legacy = new RegExp(
    '(?:^|\\n)\\s*' + escaped + ':\\s*[\'\"]?([^\'\"\\s]+)',
    'm'
  ).exec(markdown);

  return legacy ? legacy[1].trim() : null;
}

const output = {};

for (const filename of fs.readdirSync(contentDir).filter(name => /^AG-BN-\\d{3}\\.md$/.test(name))) {
  const markdown = fs.readFileSync(path.join(contentDir, filename), 'utf8');
  const ref = filename.replace(/\\.md$/, '');
  const record = {};

  for (const key of keys) {
    const image = extractImage(markdown, key);
    if (image && (/^https?:\\/\\//i.test(image) || image.startsWith('/media/') || image.startsWith('media/'))) {
      record[key] = image;
    }
  }

  output[ref] = record;
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2) + '\\n', 'utf8');
console.log(`Generated ${outputFile}`);
