// Site scaffolding: page registry, layout, calculator widget, helpers.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
export const E = require('./engine.js');
export const R = require('./render.js');
export const { gbp, pct } = E;

// Cache-busting token: changes whenever the shipped CSS or JS changes.
const ASSET_V = (() => {
  try {
    const h = createHash('md5');
    for (const f of ['style.css', 'engine.js', 'render.js', 'calc.js']) h.update(readFileSync(fileURLToPath(new URL('./' + f, import.meta.url))));
    return h.digest('hex').slice(0, 8);
  } catch (e) { return new Date().toISOString().slice(0, 10); }
})();

export const SITE = {
  name: 'Salary Calculator UK',
  url: (process.env.SITE_URL || 'https://smartsalarycalc.co.uk').replace(/\/$/, ''),
  year: '2026/27',
  ratesChecked: '22 September 2026',
  built: new Date().toISOString().slice(0, 10)
};

// ---- Page registry (Phase 1 of the topical map) -----------------------------
export const SALARIES = [30000, 40000, 50000, 60000, 100000];
const k = n => '£' + n.toLocaleString('en-GB');

export const CALC_PAGES = [
  { path: '/', short: 'Salary Calculator' },
  { path: '/take-home-pay-calculator/', short: 'Take Home Pay' },
  { path: '/income-tax-calculator/', short: 'Income Tax' },
  { path: '/national-insurance-calculator/', short: 'National Insurance' },
  { path: '/monthly-salary-calculator/', short: 'Monthly Salary' },
  { path: '/weekly-salary-calculator/', short: 'Weekly Salary' },
  { path: '/hourly-salary-calculator/', short: 'Hourly Salary' },
  { path: '/salary-after-tax-calculator/', short: 'Salary After Tax' }
];
export const salaryPath = n => `/${n}-salary-after-tax/`;
export const LIVE = new Set([
  ...CALC_PAGES.map(p => p.path), ...SALARIES.map(salaryPath), '/tax-brackets-uk/', '/about/',
  '/privacy-policy/', '/terms-of-service/', '/disclaimer/', '/contact/',
  '/student-loan-repayments/', '/scottish-income-tax/', '/bonus-after-tax/', '/pension-and-take-home-pay/'
]);
export const NOINDEX = new Set(['/privacy-policy/', '/terms-of-service/', '/disclaimer/']);
export const CONTACT_EMAIL = 'theserpmaster@gmail.com';
export const NAMES = {
  '/': 'Salary Calculator UK', '/take-home-pay-calculator/': 'Take Home Pay Calculator',
  '/income-tax-calculator/': 'Income Tax Calculator', '/national-insurance-calculator/': 'National Insurance Calculator',
  '/monthly-salary-calculator/': 'Monthly Salary Calculator', '/weekly-salary-calculator/': 'Weekly Salary Calculator',
  '/hourly-salary-calculator/': 'Hourly Salary Calculator', '/salary-after-tax-calculator/': 'Salary After Tax Calculator',
  '/tax-brackets-uk/': 'UK Tax Brackets', '/about/': 'About & Methodology',
  '/contact/': 'Contact', '/student-loan-repayments/': 'Student Loan Repayments', '/scottish-income-tax/': 'Scottish Income Tax', '/bonus-after-tax/': 'Bonus After Tax', '/pension-and-take-home-pay/': 'Pension and Take-Home Pay', '/privacy-policy/': 'Privacy Policy', '/terms-of-service/': 'Terms of Service', '/disclaimer/': 'Disclaimer',
  ...Object.fromEntries(SALARIES.map(n => [salaryPath(n), `${k(n)} Salary After Tax`]))
};

// Link only to pages that exist, so unbuilt phases never 404.
export const link = (path, text, cls) => LIVE.has(path)
  ? `<a href="${path}"${cls ? ` class="${cls}"` : ''}>${text || NAMES[path]}</a>` : (text || NAMES[path]);
export const links = (paths, cls) => paths.filter(p => LIVE.has(p)).map(p => link(p, null, cls)).join('');
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const stripTags = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export const calc = (gross, o = {}) => E.calculate({ gross, ...o });
export const kfmt = k;

// ---- Icons -------------------------------------------------------------------
const ICON = {
  chevron: '<path d="M6 9l6 6 6-6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  tune: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'
};
export const icon = (n, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// ---- FAQ ---------------------------------------------------------------------
export function faq(items) {
  const html = `<div class="faq">${items.map(([q, a]) =>
    `<details><summary><span>${q}</span>${icon('chevron', 20)}</summary><div class="ans"><p>${a}</p></div></details>`).join('')}</div>`;
  const ld = { '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: stripTags(q), acceptedAnswer: { '@type': 'Answer', text: stripTags(a) } })) };
  return { html, ld };
}

// ---- Layout --------------------------------------------------------------------
const NAV = ['/', '/take-home-pay-calculator/', '/income-tax-calculator/', '/national-insurance-calculator/', '/tax-brackets-uk/'];
const NAV_LABEL = { '/': 'Salary Calculator', '/take-home-pay-calculator/': 'Take Home Pay', '/income-tax-calculator/': 'Income Tax', '/national-insurance-calculator/': 'National Insurance', '/tax-brackets-uk/': 'Tax Brackets' };

export function layout({ path, title, desc, h1, body, ld = [], calcPage = false, crumbs = [], noindex = false }) {
  const canonical = SITE.url + path;
  const nav = NAV.filter(p => LIVE.has(p)).map(p => `<a href="${p}"${p === path ? ' aria-current="page"' : ''}>${NAV_LABEL[p]}</a>`).join('');
  const graph = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': SITE.url + '/#site', name: SITE.name, url: SITE.url + '/' },
    { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: title, description: desc, isPartOf: { '@id': SITE.url + '/#site' }, dateModified: SITE.built, inLanguage: 'en-GB' },
    ...(crumbs.length ? [{ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE.url + c[1] })) }] : []),
    ...ld
  ] };
  const footCalc = ['/', '/take-home-pay-calculator/', '/income-tax-calculator/', '/national-insurance-calculator/', '/salary-after-tax-calculator/'];
  const footMore = ['/monthly-salary-calculator/', '/weekly-salary-calculator/', '/hourly-salary-calculator/', '/tax-brackets-uk/', '/scottish-income-tax/', '/student-loan-repayments/', '/bonus-after-tax/', '/pension-and-take-home-pay/', '/about/', '/contact/'];
  const li = ps => ps.filter(p => LIVE.has(p)).map(p => `<li><a href="${p}">${NAMES[p]}</a></li>`).join('');
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${path === '/' ? '<meta name="google-site-verification" content="xg8Ui44v1MTQmc1zS5UIicvvIVbKa8OwljL6aXiQQxc" />' : ''}
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_GB"><meta property="og:image" content="${SITE.url}/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="UK salary calculator: take-home pay after tax and National Insurance"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE.url}/og-image.png">
<meta name="theme-color" content="#2563eb">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=${ASSET_V}">
<script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body${calcPage ? ' class="has-mbar"' : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container hdr">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">£</span><span>Salary Calculator <b>UK</b></span></a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div style="display:flex;gap:12px;align-items:center">
      <a class="btn btn-primary hdr-cta" href="/#calculator">Calculate salary</a>
      <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav" id="menu-btn">${icon('menu', 22)}</button>
    </div>
  </div>
  <nav class="mobile-nav" id="mnav" aria-label="Mobile">${nav}</nav>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">£</span><span>Salary Calculator UK</span></a>
        <p style="margin-top:12px">Free UK take-home pay calculator. Work out Income Tax, National Insurance, student loan and pension deductions for ${SITE.year}.</p>
        <span class="chip">HMRC ${SITE.year} rates</span>
      </div>
      <div><div class="foot-h">Calculators</div><ul>${li(footCalc)}</ul></div>
      <div><div class="foot-h">More</div><ul>${li(footMore)}</ul></div>
      <div><div class="foot-h">Popular salaries</div><ul>${li(SALARIES.map(salaryPath))}</ul></div>
      <div><div class="foot-h">Legal</div><ul>${li(['/privacy-policy/', '/terms-of-service/', '/disclaimer/'])}</ul></div>
    </div>
    <div class="foot-base"><span>© ${new Date().getFullYear()} ${SITE.name}. Estimates only, not financial or tax advice.</span><span>Covers England, Scotland, Wales and Northern Ireland.</span></div>
  </div>
</footer>
${calcPage ? '<script src="/engine.js?v=' + ASSET_V + '" defer></script><script src="/render.js?v=' + ASSET_V + '" defer></script><script src="/calc.js?v=' + ASSET_V + '" defer></script>' : ''}
<script>
(function(){var b=document.getElementById('menu-btn'),m=document.getElementById('mnav');if(!b)return;b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});})();
</script>
</body>
</html>`;
}

export const breadcrumb = (path, name) => path === '/' ? [['Home', '/']] : [['Home', '/'], [name, path]];
export const crumbsHtml = list => `<nav class="crumbs" aria-label="Breadcrumb">${list.map((c, i) =>
  i === list.length - 1 ? `<span aria-current="page">${c[0]}</span>` : `<a href="${c[1]}">${c[0]}</a><span aria-hidden="true">›</span>`).join(' ')}</nav>`;

// ---- Calculator widget -----------------------------------------------------------
const FREQS = [['annual', 'Annual'], ['monthly', 'Monthly'], ['weekly', 'Weekly'], ['hourly', 'Hourly']];
const FREQ_LABEL = { annual: 'Gross annual salary', monthly: 'Gross monthly salary', weekly: 'Gross weekly pay', hourly: 'Gross hourly rate' };
const DEFAULT_HOURS = 37.5;

export function calcOpen({ salary, freq = 'annual' }) {
  return `<div id="calc" data-freq="${freq}" data-salary="${salary}">`;
}
export const calcClose = '</div>';

export function calcWidget({ salary, freq = 'annual', formTitle = 'Calculate your take-home pay' }) {
  const r = calc(salary, { hoursPerWeek: DEFAULT_HOURS, taxCode: '1257L' });
  const v = E.fromAnnual(salary, freq, DEFAULT_HOURS);
  const shown = freq === 'hourly' ? v.toFixed(2) : Math.round(v);
  const step = freq === 'hourly' ? '0.25' : freq === 'annual' ? '500' : '50';
  const opts = (arr, sel) => arr.map(([v2, t]) => `<option value="${v2}"${v2 === sel ? ' selected' : ''}>${t}</option>`).join('');
  return `
<div class="calc-grid" id="calculator">
  <form class="panel" novalidate autocomplete="off" aria-label="Salary calculator">
    <div class="panel-head"><div><h2>${formTitle}</h2><p>Set your pay and deductions. Results update as you type.</p></div><span class="chip blue">HMRC <span data-year-label>${SITE.year}</span></span></div>
    <div class="field"><span class="lbl" id="lbl-period">Pay period</span>
      <div class="pills" role="group" aria-labelledby="lbl-period">${FREQS.map(([f, t]) =>
        `<button type="button" class="pill${f === freq ? ' on' : ''}" data-freq="${f}" aria-pressed="${f === freq}">${t}</button>`).join('')}</div></div>
    <div class="field strong"><label id="lbl-salary" for="f-salary">${FREQ_LABEL[freq]}</label>
      <div class="money"><span class="sym" aria-hidden="true">£</span><input id="f-salary" type="number" inputmode="decimal" min="0" step="${step}" value="${shown}"><span class="unit">GBP</span></div></div>
    <div class="field" id="row-hours"${freq === 'hourly' ? '' : ' hidden'}><label for="f-hours">Hours worked per week</label><input id="f-hours" type="number" inputmode="decimal" min="1" max="100" step="0.5" value="${DEFAULT_HOURS}"><p class="help">Used to turn an hourly rate into an annual salary (52 weeks).</p></div>
    <div class="grid2">
      <div class="field"><label for="f-year">Tax year</label><select id="f-year"><option value="2026-27" selected>2026/27 (current)</option><option value="2025-26">2025/26 (previous)</option></select></div>
      <div class="field"><label for="f-code">Tax code</label><input id="f-code" type="text" value="1257L" maxlength="8" spellcheck="false" autocapitalize="characters"><p class="hint" id="code-hint" hidden>Not a recognised tax code, so 1257L is used.</p></div>
      <div class="field"><label for="f-region">Where do you pay tax?</label><select id="f-region"><option value="uk" selected>England, Wales &amp; N. Ireland</option><option value="scotland">Scotland</option></select></div>
      <div class="field"><label for="f-loan">Student loan</label><select id="f-loan">${opts([['none', 'No student loan'], ['plan1', 'Plan 1'], ['plan2', 'Plan 2'], ['plan4', 'Plan 4 (Scotland)'], ['plan5', 'Plan 5']], 'none')}</select></div>
      <div class="field"><label for="f-pct">Pension contribution (%)</label><input id="f-pct" type="number" inputmode="decimal" min="0" max="100" step="0.5" value="0"></div>
      <div class="field"><label for="f-ptype">How is your pension paid?</label><select id="f-ptype">${opts([['netpay', 'Net pay (before tax)'], ['sacrifice', 'Salary sacrifice'], ['ras', 'Relief at source']], 'netpay')}</select></div>
    </div>
    <details class="adv"><summary><span style="display:inline-flex;gap:8px;align-items:center">${icon('tune')} More options</span>${icon('chevron', 20)}</summary>
      <div class="adv-body">
        <label class="check"><input id="f-pg" type="checkbox"><span><b>Postgraduate loan</b><small>6% of pay over £21,000, on top of any plan above</small></span></label>
        <div class="grid2">
          <div class="field"><label for="f-bonus">Annual bonus (£)</label><input id="f-bonus" type="number" inputmode="decimal" min="0" step="100" value="0"></div>
          <div class="field"><label for="f-sac">Other salary sacrifice (£ a year)</label><input id="f-sac" type="number" inputmode="decimal" min="0" step="100" value="0"><p class="help">E.g. cycle to work or a car scheme.</p></div>
        </div>
      </div></details>
    <div class="actions"><button type="button" class="btn btn-primary btn-lg" id="btn-calc">${icon('calc')} Calculate my salary</button><button type="button" class="btn btn-ghost btn-lg" id="btn-reset">Reset</button></div>
  </form>
  <aside class="panel dock" id="results" aria-label="Your take-home pay">
    <div class="panel-head"><h2>Your take-home pay</h2><span class="live"><i></i>Live estimate</span></div>
    <div id="o-dock">${R.dock(r, freq === 'annual' ? 'monthly' : freq)}</div>
  </aside>
</div>
<div class="mbar"><div><span>Take-home</span><strong id="mbar-val">${gbp(r.periods.monthly)} / month</strong></div><a class="btn btn-primary" href="#results">See breakdown</a></div>`;
}

export function statsSection(salary, title = 'Your salary breakdown', sub = 'The statutory deductions from your gross pay, and what is left.') {
  const r = calc(salary, { taxCode: '1257L' });
  return `<section class="section"><div class="container"><div class="section-head"><h2>${title}</h2><p>${sub}</p></div><div class="stats" id="o-cards">${R.cards(r)}</div></div></section>`;
}

export function compareSection(salary) {
  const pills = [[5000, '+£5,000'], [10000, '+£10,000'], [20000, '+£20,000'], [-5000, '-£5,000']];
  return `<section class="section"><div class="container"><div class="delta-panel">
    <div class="section-head" style="margin-bottom:0"><span class="chip blue">Pay rise analyser</span><h2 style="margin-top:8px">What would a pay change do to your take-home?</h2><p>Compare your salary above with a raise, promotion or job offer. Higher-rate tax, National Insurance and student loan all change how much you keep.</p></div>
    <div class="delta-pills" role="group" aria-label="Pay change">${pills.map(([d, t]) => `<button type="button" class="dpill${d === 10000 ? ' on' : ''}" data-delta="${d}" aria-pressed="${d === 10000}">${t}</button>`).join('')}</div>
    <div class="delta-box" id="o-compare">${R.compare({ gross: salary, taxCode: '1257L' }, 10000)}</div>
  </div></div></section>`;
}

export function bandsSection(salary, { title = 'Your tax and National Insurance, band by band', intro = '' } = {}) {
  const b = R.bandTables(calc(salary, { taxCode: '1257L' }));
  return `<section class="section"><div class="container"><div class="section-head"><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ''}</div>
    <div class="cols2"><div id="o-bands-tax">${b.tax}</div><div id="o-bands-ni">${b.ni}</div></div></div></section>`;
}

export const trustSection = () => `<section class="section"><div class="container"><div class="trust">
  <h2>Simple. Transparent. Free.</h2>
  <p style="color:var(--slate-2);max-width:560px;margin:0 auto">Every calculation runs in your browser. Nothing you type is stored or sent anywhere.</p>
  <div class="trust-grid"><div><b>No registration</b><span>No sign-up and no email needed</span></div><div><b>Built on HMRC rules</b><span>${SITE.year} rates, thresholds and Scottish bands</span></div><div><b>Shows its working</b><span>Every band and rate is visible</span></div></div>
  <p class="disclaimer"><strong>Disclaimer:</strong> This calculator gives estimates for general planning. Your real deductions depend on your tax code, pay period, employer pension scheme, benefits in kind (P11D) and student loan timing. ${link('/about/', 'See our methodology')}.</p>
</div></div></section>`;

export const ctaSection = (h = 'Calculate any salary or compare two job offers', p = 'Model bonuses, pensions, student loans and Scottish tax in seconds.') => `<section class="section"><div class="container"><div class="cta"><h2>${h}</h2><p>${p}</p><div class="cta-actions"><a class="btn" href="/#calculator">Open the calculator</a>${LIVE.has('/take-home-pay-calculator/') ? '<a class="btn alt" href="/take-home-pay-calculator/">Take home pay calculator</a>' : ''}</div></div></div></section>`;

export const hero = ({ badge, h1, lead, center = false }) => `<section class="hero${center ? ' center' : ''}"><div class="container">
  ${badge ? `<div class="badge"><i></i>${badge}</div>` : ''}<h1>${h1}</h1><p class="lead">${lead}</p></div></section>`;

export const tableWrap = (caption, head, rows, hl = -1) => `<div class="table-wrap" tabindex="0" role="region" aria-label="${String(caption).replace(/<[^>]*>/g, '')}"><table class="tbl"><caption>${caption}</caption><thead><tr>${head.map((h, i) => `<th${i ? ' class="r"' : ''}>${h || '<span class="sr-only">Item</span>'}</th>`).join('')}</tr></thead><tbody>${rows.map((row, ri) =>
  `<tr${ri === hl ? ' class="hl"' : ''}>${row.map((c, i) => `<td${i ? ' class="r"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

export const popularTiles = (current) => `<div class="tiles">${SALARIES.map(n => {
  const r = calc(n);
  return `<a class="tile${n === current ? ' cur' : ''}" href="${salaryPath(n)}"><div><b>${kfmt(n)}</b><small>Take-home: <strong>${gbp(r.periods.monthly)} /mo</strong></small></div><span class="go"><span>${n === current ? 'You are here' : 'See breakdown'}</span>${icon('arrow')}</span></a>`;
}).join('')}</div>`;
