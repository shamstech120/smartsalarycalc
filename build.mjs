// Static build: node build.mjs   (set SITE_URL=https://yourdomain.com for canonical URLs and the sitemap)
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { buildAll } from './src/pages.mjs';
import { SITE, layout } from './src/site.mjs';

const OUT = 'dist';
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const pages = buildAll();
for (const [path, html] of Object.entries(pages)) {
  const file = path === '/' ? join(OUT, 'index.html') : join(OUT, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// 404 (not indexed)
writeFileSync(join(OUT, '404.html'), layout({
  path: '/404.html', title: `Page not found – ${SITE.name}`, desc: 'This page does not exist.', h1: 'Page not found', noindex: true,
  body: `<section class="hero"><div class="container"><h1>Page not found</h1><p class="lead">That page does not exist. Try the <a href="/">salary calculator</a>.</p></div></section>`
}));

for (const f of ['engine.js', 'render.js', 'calc.js', 'style.css']) copyFileSync(join('src', f), join(OUT, f));
writeFileSync(join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2563EB"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="21" fill="#fff">£</text></svg>`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  Object.keys(pages).map(p => `  <url><loc>${SITE.url}${p}</loc><lastmod>${SITE.built}</lastmod></url>`).join('\n') + `\n</urlset>\n`);

console.log(`Built ${Object.keys(pages).length} pages -> ${OUT}/  (canonical base: ${SITE.url})`);
