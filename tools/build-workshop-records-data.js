const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'workshop');
const OUT = path.join(ROOT, 'assets', 'data', 'workshop-records.json');

function scalar(value) {
  value = String(value || '').trim();
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, body: text.trim() };
  const lines = match[1].split(/\r?\n/);
  const data = {};
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }
    const m = line.match(/^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const indent = m[1].length;
    const key = m[2];
    let value = m[3];

    if (value === '') {
      const next = lines[i + 1] || '';
      if (/^\s*-\s+/.test(next)) {
        const arr = [];
        i++;
        while (i < lines.length) {
          const l = lines[i];
          const item = l.match(/^(\s*)-\s+(.*)$/);
          if (!item || item[1].length <= indent) break;
          const rest = item[2];
          const objMatch = rest.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
          if (objMatch) {
            const obj = {};
            obj[objMatch[1]] = scalar(objMatch[2]);
            i++;
            while (i < lines.length) {
              const sub = lines[i].match(/^(\s+)([A-Za-z0-9_-]+):\s*(.*)$/);
              if (!sub || sub[1].length <= item[1].length) break;
              obj[sub[2]] = scalar(sub[3]);
              i++;
            }
            arr.push(obj);
          } else {
            arr.push(scalar(rest));
            i++;
          }
        }
        data[key] = arr;
        continue;
      }
    }

    // Fold simple wrapped scalar lines until the next top-level key.
    if (value && (value.startsWith('"') && !value.endsWith('"'))) {
      const parts = [value];
      i++;
      while (i < lines.length && !/^\s*[A-Za-z0-9_-]+:\s*/.test(lines[i])) {
        parts.push(lines[i].trim());
        i++;
      }
      value = parts.join(' ');
      if (value.endsWith('"')) value = value.slice(0, -1);
      data[key] = scalar(value);
      continue;
    }

    data[key] = scalar(value);
    i++;
  }

  return { data, body: match[2].trim() };
}

function parseSections(body) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      if (current) sections.push(current);
      current = { heading: h[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map(s => ({ heading: s.heading, body: s.body.join('\n').trim() }));
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.log('Workshop content directory not found; nothing to build.');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), records: [] }, null, 2) + '\n');
  process.exit(0);
}

const files = fs.readdirSync(CONTENT_DIR).filter(f => /\.md$/i.test(f));
const records = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
  const parsed = parseFrontmatter(raw);
  const d = parsed.data;
  if (!d.ref) continue;
  if (String(d.status || 'published').toLowerCase() !== 'published') continue;
  records.push({
    ref: d.ref,
    title: d.title || '',
    subtitle: d.subtitle || '',
    year: d.year || '',
    excerpt: d.excerpt || '',
    hero: d.hero || '',
    instruments: Array.isArray(d.instruments) ? d.instruments : [],
    before_images: Array.isArray(d.before_images) ? d.before_images : [],
    workshop_images: Array.isArray(d.workshop_images) ? d.workshop_images : [],
    after_images: Array.isArray(d.after_images) ? d.after_images : [],
    quote: d.quote || '',
    sections: parseSections(parsed.body),
    source: `content/workshop/${file}`
  });
}

records.sort((a, b) => String(b.ref).localeCompare(String(a.ref), undefined, { numeric: true }));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2) + '\n');
console.log(`Workshop Records: ${records.length} published record(s) written to ${path.relative(ROOT, OUT)}`);
