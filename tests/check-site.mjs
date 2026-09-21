// Post-build checks: every internal link resolves, every page has one H1, a unique title/description,
// canonical URL, valid JSON-LD, and no unrendered template junk.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(DIST).filter(f => f.endsWith('.html') && !f.endsWith('404.html'));
const errors = [], titles = new Map(), descs = new Map();
const exists = href => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return true;
  const f = clean.endsWith('/') ? join(DIST, clean, 'index.html') : join(DIST, clean);
  return existsSync(f);
};

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const tag = m => (m ? m[1] : null);
  const title = tag(html.match(/<title>([^<]*)<\/title>/));
  const desc = tag(html.match(/<meta name="description" content="([^"]*)"/));
  const h1s = (html.match(/<h1[ >]/g) || []).length;
  if (!title) errors.push(`${file}: missing <title>`);
  if (title && title.length > 75) errors.push(`${file}: title long (${title.length})`);
  if (!desc) errors.push(`${file}: missing description`);
  if (desc && desc.length > 170) errors.push(`${file}: description long (${desc.length})`);
  if (h1s !== 1) errors.push(`${file}: ${h1s} H1s`);
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) errors.push(`${file}: no canonical`);
  if (titles.has(title)) errors.push(`${file}: duplicate title with ${titles.get(title)}`); titles.set(title, file);
  if (descs.has(desc)) errors.push(`${file}: duplicate description with ${descs.get(desc)}`); descs.set(desc, file);
  if (/undefined|NaN|\[object|\$\{/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) errors.push(`${file}: contains undefined/NaN/[object]/\${`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { errors.push(`${file}: invalid JSON-LD`); }
  }
  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) if (!exists(m[1])) errors.push(`${file}: broken link ${m[1]}`);
  for (const m of html.matchAll(/(?:src)="(\/[^"]*)"/g)) if (!exists(m[1])) errors.push(`${file}: missing asset ${m[1]}`);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) errors.push(`${file}: duplicate ids ${[...new Set(dup)].join(', ')}`);
}
console.log(`${pages.length} pages checked, ${errors.length} problem(s)`);
errors.forEach(e => console.log('  ✖ ' + e));
process.exit(errors.length ? 1 : 0);
