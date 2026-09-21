// Page builders. Every number on every page comes from the shared engine.
import {
  E, R, SITE, SALARIES, CALC_PAGES, LIVE, NAMES, salaryPath, link, links, faq, calc, gbp, pct, kfmt, icon,
  layout, breadcrumb, crumbsHtml, calcOpen, calcClose, calcWidget, statsSection, compareSection, bandsSection,
  trustSection, ctaSection, hero, tableWrap, popularTiles, CONTACT_EMAIL
} from './site.mjs';

const Y = E.YEARS['2026-27'];
const y = SITE.year;
const UK = { taxCode: '1257L' };
const sec = (inner, cls = '') => `<section class="section ${cls}"><div class="container">${inner}</div></section>`;
const head = (h, p) => `<div class="section-head"><h2>${h}</h2>${p ? `<p>${p}</p>` : ''}</div>`;
const salLink = n => LIVE.has(salaryPath(n)) ? `<a href="${salaryPath(n)}">${kfmt(n)}</a>` : kfmt(n);
const related = (items) => sec(`${head('Related calculators and guides')}<div class="related">${items.filter(p => LIVE.has(p)).map((p, i) => `<a href="${p}"${i === 0 ? ' class="primary"' : ''}>${NAMES[p]}</a>`).join('')}</div>`);
const webApp = (path, name, desc) => ({ '@type': 'WebApplication', name, url: SITE.url + path, description: desc, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' } });
const faqSection = f => sec(`${head('Frequently asked questions')}<div class="narrow">${f.html}</div>`, '');

const CORE_LINKS = ['/', '/take-home-pay-calculator/', '/income-tax-calculator/', '/national-insurance-calculator/', '/salary-after-tax-calculator/', '/monthly-salary-calculator/', '/weekly-salary-calculator/', '/hourly-salary-calculator/', '/tax-brackets-uk/'];

// ---- Shared tables -------------------------------------------------------------
function monthlyTable(salaries, current) {
  return tableWrap(`Monthly pay by salary (${y}, England, Wales &amp; NI, code 1257L)`,
    ['Salary', 'Gross a month', 'Income Tax', 'NI', 'Take-home a month', 'Take-home a year'],
    salaries.map(n => { const r = calc(n, UK); return [salLink(n), gbp(r.periods.grossMonthly), `<span class="e">-${gbp(r.tax / 12)}</span>`, `<span class="e">-${gbp(r.ni / 12)}</span>`, `<strong>${gbp(r.periods.monthly)}</strong>`, `<span class="g">${gbp(r.net)}</span>`]; }),
    salaries.indexOf(current));
}
function afterTaxTable(salaries) {
  return tableWrap(`Take-home pay by salary (${y})`,
    ['Salary', 'Income Tax', 'National Insurance', 'Take-home a year', 'Take-home a month', 'You keep'],
    salaries.map(n => { const r = calc(n, UK); return [salLink(n), gbp(r.tax), gbp(r.ni), `<strong>${gbp(r.net)}</strong>`, gbp(r.periods.monthly), pct(r.keptRate)]; }));
}
const rulesCards = () => `<div class="cols3">
  <div class="card"><h3>Income Tax bands</h3><p style="color:var(--slate-2);font-size:14px">Tax is charged in slices. Only the pay inside each band is taxed at that band's rate.</p><ul class="rules">
    <li><span>Personal Allowance</span><span>£0 – ${gbp(Y.personalAllowance)} (0%)</span></li>
    <li><span>Basic rate</span><span>${gbp(Y.personalAllowance + 1)} – ${gbp(Y.niUEL)} (20%)</span></li>
    <li><span>Higher rate</span><span>${gbp(Y.niUEL + 1)} – ${gbp(Y.additionalStart)} (40%)</span></li>
    <li><span>Additional rate</span><span>Over ${gbp(Y.additionalStart)} (45%)</span></li></ul></div>
  <div class="card"><h3>National Insurance</h3><p style="color:var(--slate-2);font-size:14px">Class 1 NI is taken from employee pay, separately from Income Tax.</p><ul class="rules">
    <li><span>Primary Threshold</span><span>Under ${gbp(Y.niPT)} (0%)</span></li>
    <li><span>Main rate</span><span>${gbp(Y.niPT)} – ${gbp(Y.niUEL)} (8%)</span></li>
    <li><span>Upper rate</span><span>Over ${gbp(Y.niUEL)} (2%)</span></li>
    <li><span>Monthly threshold</span><span>${gbp(1048)}</span></li></ul></div>
  <div class="card"><h3>Allowance taper</h3><p style="color:var(--slate-2);font-size:14px">Above £100,000 you lose £1 of allowance for every £2 earned, creating a 60% effective rate.</p><ul class="rules">
    <li><span>Standard code</span><span>1257L (${gbp(Y.personalAllowance)})</span></li>
    <li><span>Taper starts</span><span>${gbp(Y.taperStart)}</span></li>
    <li><span>Allowance fully lost</span><span>${gbp(Y.additionalStart)}</span></li>
    <li><span>Ways to reduce it</span><span>Pension contributions</span></li></ul></div></div>`;

// Marginal rate label, e.g. "42%".
const mr = (n, o = {}) => pct(E.marginalRate({ gross: n, taxCode: '1257L', ...o }), 0);

// ---- Generic calculator page ------------------------------------------------------
function calcPage({ path, title, desc, h1, badge, lead, freq = 'annual', salary, extra = '', faqItems, relatedPaths, center = false, home = false }) {
  const f = faq(faqItems);
  const crumbs = breadcrumb(path, NAMES[path]);
  const body = `${home ? '' : crumbsHtml(crumbs)}
${hero({ badge, h1, lead, center })}
${calcOpen({ salary, freq })}
${sec(calcWidget({ salary, freq }), '')}
${statsSection(salary)}
${extra}
${compareSection(salary)}
${bandsSection(salary, { intro: `How your pay is split across Income Tax bands and National Insurance. This updates with the calculator above.` })}
${faqSection(f)}
${related(relatedPaths || CORE_LINKS.filter(p => p !== path))}
${home ? '' : ctaSection()}
${trustSection()}
${calcClose}`;
  return layout({ path, title, desc, h1, body, calcPage: true, crumbs, ld: [webApp(path, NAMES[path], desc), f.ld] });
}

// ---- Home ----------------------------------------------------------------------------
function homePage() {
  const s = 35000, r = calc(s, UK), r30 = calc(30000, UK), r40 = calc(40000, UK), r50 = calc(50000, UK);
  const toolTiles = [
    ['/take-home-pay-calculator/', 'See what reaches your bank account after every deduction.'],
    ['/income-tax-calculator/', 'Income Tax band by band, with effective and marginal rates.'],
    ['/national-insurance-calculator/', 'Class 1 National Insurance on your pay.'],
    ['/monthly-salary-calculator/', 'Your monthly payslip figure.'],
    ['/weekly-salary-calculator/', 'Weekly take-home for weekly-paid work.'],
    ['/hourly-salary-calculator/', 'Hourly pay after tax, from any rate.'],
    ['/salary-after-tax-calculator/', 'Annual salary after tax at every level.']
  ].filter(([p]) => LIVE.has(p));
  const extra = `
${sec(`${head('Calculators for every question', 'One calculation engine, focused on the question you are actually asking.')}<div class="tiles three">${toolTiles.map(([p, d]) => `<a class="tile" href="${p}"><div><b style="font-size:18px">${NAMES[p]}</b><p>${d}</p></div><span class="go"><span>Open calculator</span>${icon('arrow')}</span></a>`).join('')}</div>`)}
${sec(`${head(`How much is ${kfmt(s)} after tax in the UK?`, `On ${kfmt(s)} in England, Wales or Northern Ireland you take home about <strong>${gbp(r.net)} a year</strong>, or <strong>${gbp(r.periods.monthly)} a month</strong>, in ${y}. You pay no tax on the first ${gbp(Y.personalAllowance)} (your Personal Allowance), 20% Income Tax on the rest, and 8% National Insurance on pay above ${gbp(Y.niPT)}.`)}
${tableWrap(`UK take-home pay benchmarks, ${y} (England, Wales &amp; NI, code 1257L)`, ['Salary', 'Gross a month', 'Tax a month', 'NI a month', 'Take-home a month', 'Take-home a year'],
    [20000, 25000, 30000, 35000, 40000, 50000, 60000, 75000, 100000].map(n => { const c = calc(n, UK); return [salLink(n), gbp(c.periods.grossMonthly), `<span class="e">-${gbp(c.tax / 12)}</span>`, `<span class="e">-${gbp(c.ni / 12)}</span>`, `<strong>${gbp(c.periods.monthly)}</strong>`, `<span class="g">${gbp(c.net)}</span>`]; }), 3)}`)}
${sec(`${head('Popular salary calculations', 'Full breakdowns, with unique tax insights for each level.')}${popularTiles(0)}`)}
${sec(`${head(`UK Income Tax and National Insurance rules for ${y}`, 'The rates and thresholds the calculator applies. Scottish taxpayers use different Income Tax bands.')}${rulesCards()}`)}`;
  const faqItems = [
    ['How does the UK salary calculator work?', `It applies the ${y} HMRC rules to your gross pay: Personal Allowance, Income Tax bands (or the six Scottish bands), employee Class 1 National Insurance, plus any pension, student loan or salary sacrifice you enter. The result is shown per year, month, week, day and hour.`],
    ['How much tax will I pay on my salary?', `Most people have a ${gbp(Y.personalAllowance)} tax-free Personal Allowance. Pay from ${gbp(Y.personalAllowance + 1)} to ${gbp(Y.niUEL)} is taxed at 20%, pay up to ${gbp(Y.additionalStart)} at 40%, and anything above at 45%. Because tax is charged in slices, a pay rise never reduces your take-home pay.`],
    ['How much is £30,000 after tax?', `On £30,000 you pay ${gbp(r30.tax)} Income Tax and ${gbp(r30.ni)} National Insurance, leaving ${gbp(r30.net)} a year, or ${gbp(r30.periods.monthly)} a month.`],
    ['How much is £40,000 after tax?', `On £40,000 you pay ${gbp(r40.tax)} Income Tax and ${gbp(r40.ni)} National Insurance, leaving ${gbp(r40.net)} a year, or ${gbp(r40.periods.monthly)} a month.`],
    ['How much is £50,000 after tax?', `On £50,000 you pay ${gbp(r50.tax)} Income Tax and ${gbp(r50.ni)} National Insurance, leaving ${gbp(r50.net)} a year, or ${gbp(r50.periods.monthly)} a month.`],
    ['How is National Insurance calculated?', `Employee Class 1 NI is charged at 8% on pay between ${gbp(Y.niPT)} and ${gbp(Y.niUEL)} a year (${gbp(242)} to ${gbp(967)} a week), and 2% on pay above that. It is separate from Income Tax and does not depend on your tax code.`],
    ['Does the calculator include pension and student loan?', `Yes. Enter a pension percentage and choose whether it is paid by net pay, salary sacrifice or relief at source, because each affects tax and NI differently. Student loan Plans 1, 2, 4 and 5 and the 6% postgraduate loan are supported.`],
    ['Does it work for Scottish taxpayers?', `Yes. Choose Scotland under "Where do you pay tax?" to use the six Scottish bands (19%, 20%, 21%, 42%, 45% and 48%) for ${y}. National Insurance is the same across the UK.`],
    ['Is this salary calculator free?', 'Yes. It is free, needs no registration and runs entirely in your browser, so the figures you enter are not stored or sent anywhere.']
  ];
  return calcPage({
    path: '/', home: true, center: true, salary: s, faqItems, extra,
    title: `Salary Calculator UK ${y} – Take-Home Pay After Tax & NI`,
    desc: `Free UK salary calculator for ${y}. See take-home pay after Income Tax, National Insurance, pension and student loan in England, Scotland, Wales and NI.`,
    h1: 'Salary Calculator <span style="color:var(--cobalt)">UK</span>', badge: `UK salary calculator ${y}`,
    lead: `Calculate your take-home pay, Income Tax, National Insurance and net salary in seconds, using the latest HMRC ${y} rates.`,
    relatedPaths: ['/take-home-pay-calculator/', '/income-tax-calculator/', '/national-insurance-calculator/', '/tax-brackets-uk/', '/about/']
  });
}

// ---- Core calculator pages ------------------------------------------------------------
function takeHomePage() {
  const base = 35000;
  const scen = [
    ['No extra deductions', {}],
    ['5% pension (net pay)', { pensionPct: 5, pensionType: 'netpay' }],
    ['5% pension (salary sacrifice)', { pensionPct: 5, pensionType: 'sacrifice' }],
    ['Plan 1 student loan', { studentLoan: 'plan1' }],
    ['Plan 2 student loan', { studentLoan: 'plan2' }],
    ['Postgraduate loan', { postgrad: true }],
    ['Plan 2 loan and 5% pension (net pay)', { studentLoan: 'plan2', pensionPct: 5 }],
    ['Scottish taxpayer', { region: 'scotland' }]
  ];
  const b = calc(base, UK);
  const rows = scen.map(([name, o], i) => { const c = calc(base, { ...UK, ...o }); const d = c.net - b.net; return [name, gbp(c.net), `<strong>${gbp(c.periods.monthly)}</strong>`, i === 0 ? '–' : `<span class="${d < 0 ? 'e' : 'g'}">${d < 0 ? '-' : '+'}${gbp(Math.abs(d / 12))} a month</span>`]; });
  const extra = sec(`${head(`What comes out of your pay`, 'Four deductions explain almost every difference between gross and take-home pay.')}
<div class="cols2">
 <div class="card"><h3>Income Tax (PAYE)</h3><p>Charged in bands after your Personal Allowance: 20% up to ${gbp(Y.niUEL)}, 40% up to ${gbp(Y.additionalStart)}, then 45%. Scotland has six bands. Your tax code decides how much allowance your employer applies.</p></div>
 <div class="card"><h3>National Insurance</h3><p>8% on pay between ${gbp(Y.niPT)} and ${gbp(Y.niUEL)}, then 2% above. It builds your State Pension record and is not reduced by net-pay pension contributions.</p></div>
 <div class="card"><h3>Workplace pension</h3><p>Paid from gross pay under net pay or salary sacrifice, or from taxed pay under relief at source. Salary sacrifice also cuts National Insurance, so it usually costs you least.</p></div>
 <div class="card"><h3>Student and postgraduate loans</h3><p>9% of pay over your plan threshold (${gbp(Y.loans.plan1)} Plan 1, ${gbp(Y.loans.plan2)} Plan 2, ${gbp(Y.loans.plan4)} Plan 4, ${gbp(Y.loans.plan5)} Plan 5) and 6% over ${gbp(Y.pgThreshold)} for a postgraduate loan.</p></div>
</div>`) + sec(`${head(`Same ${kfmt(base)} salary, different take-home`, `How common deductions change what you keep on ${kfmt(base)} in ${y}. Change the calculator above to test your own situation.`)}
${tableWrap('Take-home pay on ' + kfmt(base) + ' with different deductions', ['Scenario', 'Take-home a year', 'Take-home a month', 'Change vs. no deductions'], rows, 0)}`);
  const c50 = calc(base, { ...UK, pensionPct: 5, pensionType: 'sacrifice' }), c50n = calc(base, { ...UK, pensionPct: 5 });
  return calcPage({
    path: '/take-home-pay-calculator/', salary: base, extra,
    title: `Take Home Pay Calculator UK ${y} – Salary After All Deductions`,
    desc: `Work out your UK take-home pay for ${y} after Income Tax, National Insurance, pension and student loan. See yearly, monthly, weekly and hourly pay.`,
    h1: 'Take Home Pay Calculator UK', badge: `Take-home pay ${y}`,
    lead: `Find out exactly what lands in your bank account. Enter your salary and any pension or student loan deductions to see your real take-home pay.`,
    faqItems: [
      ['What is take-home pay?', 'Take-home pay (net pay) is what you receive after your employer deducts Income Tax, National Insurance, pension contributions and any student loan repayments from your gross pay.'],
      ['Why is my payslip different from the calculator?', 'Payslips reflect your actual tax code, how many pay periods have passed, benefits in kind, one-off bonuses and the exact timing of student loan and pension deductions. The calculator assumes a steady annual salary and the standard 1257L code, so expect small differences.'],
      ['How much does a pension reduce my take-home pay?', `On ${kfmt(base)}, a 5% pension paid through net pay reduces annual take-home by ${gbp(b.net - c50n.net)} (not the full ${gbp(base * 0.05)}), because you save 20% tax. Through salary sacrifice it falls by only ${gbp(b.net - c50.net)}, because you also save National Insurance.`],
      ['Do student loan repayments count as tax?', 'No. Student loan repayments are collected through payroll alongside tax, but they are repayments of a debt. They are calculated on pay over your plan threshold, not on your tax bands.'],
      ['Is take-home pay the same as net pay?', 'Yes. Gross pay is your salary before deductions; net pay or take-home pay is what remains.']
    ]
  });
}

function incomeTaxPage() {
  const s = 45000;
  const rows = [15000, 25000, 35000, 45000, 55000, 80000, 110000, 150000].map(n => {
    const c = calc(n, UK); return [salLink(n), gbp(c.personalAllowance), gbp(c.tax), pct(c.effectiveTaxRate), `<strong>${mr(n)}</strong>`];
  });
  const scot = Y.scotland.map((b, i) => { let from = Y.personalAllowance; for (let j = 0; j < i; j++) from += Y.scotland[j].width; return [b.name, (b.rate * 100).toFixed(0) + '%', gbp(from + (i ? 1 : 1)), isFinite(b.width) ? gbp(from + b.width) : 'and above']; });
  const c110 = calc(110000, UK), c125 = calc(125140, UK);
  const extra = sec(`${head(`Income Tax rates and bands ${y}`, 'Rates for England, Wales and Northern Ireland, and the separate Scottish bands.')}
<div class="cols2">
${tableWrap(`England, Wales &amp; Northern Ireland ${y}`, ['Band', 'Rate', 'Taxable income'], [
    ['Personal Allowance', '0%', `Up to ${gbp(Y.personalAllowance)}`], ['Basic rate', '20%', `${gbp(Y.personalAllowance + 1)} to ${gbp(Y.niUEL)}`],
    ['Higher rate', '40%', `${gbp(Y.niUEL + 1)} to ${gbp(Y.additionalStart)}`], ['Additional rate', '45%', `Over ${gbp(Y.additionalStart)}`]])}
${tableWrap(`Scotland ${y}`, ['Band', 'Rate', 'From', 'To'], scot)}
</div>`) + sec(`${head('Effective rate vs. marginal rate', 'Your effective rate is total tax divided by pay. Your marginal rate is what you lose on the next pound. They are very different.')}
${tableWrap(`Income Tax by salary, ${y} (England, Wales &amp; NI)`, ['Salary', 'Personal Allowance', 'Income Tax', 'Effective tax rate', 'Marginal rate (tax + NI)'], rows, 3)}
<div class="callout"><p><strong>The £100,000 trap.</strong> Between £100,000 and ${gbp(Y.additionalStart)} your Personal Allowance shrinks by £1 for every £2 you earn. At £110,000 your allowance is ${gbp(c110.personalAllowance)} and your marginal rate including NI is ${mr(110000)}. At ${gbp(Y.additionalStart)} it is gone entirely and you pay ${gbp(c125.tax)} tax.</p></div>`) + sec(`${head('Understanding your tax code')}<div class="prose">
<p>Your tax code tells your employer how much tax-free pay to give you. <strong>1257L</strong> is the standard code for ${y}: the number is your allowance divided by ten, plus a letter. The calculator applies your code from the input above.</p>
<ul><li><strong>BR</strong>: all pay taxed at 20% (often a second job).</li><li><strong>D0 / D1</strong>: all pay taxed at 40% or 45%.</li><li><strong>0T</strong>: no allowance, so tax from the first pound.</li><li><strong>K codes</strong>: you owe tax on untaxed income, so the code adds to your taxable pay.</li><li><strong>S prefix</strong>: Scottish taxpayer. <strong>C prefix</strong>: Welsh taxpayer (Welsh rates currently match England).</li></ul></div>`);
  return calcPage({
    path: '/income-tax-calculator/', salary: s, extra,
    title: `Income Tax Calculator UK ${y} – Tax by Band`,
    desc: `Calculate UK Income Tax for ${y} band by band. Includes Scottish rates, tax codes, the £100k allowance taper, and effective vs. marginal rates.`,
    h1: 'Income Tax Calculator UK', badge: `Income Tax ${y}`,
    lead: `See how much Income Tax you pay on your salary, split across each ${y} tax band, for England, Wales, Northern Ireland or Scotland.`,
    faqItems: [
      ['How much Income Tax will I pay?', `It depends on your pay and where you live. In England on ${kfmt(s)} you pay ${gbp(calc(s, UK).tax)} a year, an effective rate of ${pct(calc(s, UK).effectiveTaxRate)}. In Scotland the same salary pays ${gbp(calc(s, { ...UK, region: 'scotland' }).tax)}.`],
      ['What is the difference between effective and marginal tax rate?', 'The effective rate is your total tax as a share of total pay. The marginal rate is the tax on your next pound. A basic-rate taxpayer has a 20% marginal rate but a lower effective rate, because the first £12,570 is tax-free.'],
      ['Can a pay rise leave me worse off?', 'No. Tax is charged in slices, so only the pay above a threshold is taxed at the higher rate. The nearest thing to a "cliff" is between £100,000 and £125,140, where the allowance taper makes the marginal rate about 62%, but your take-home pay still rises.'],
      ['Does Wales have different Income Tax?', 'Wales sets its own rates, but they currently mirror England (20%, 40%, 45%), so Welsh taxpayers use the same bands as England and Northern Ireland here.'],
      ['Does the calculator include National Insurance?', 'Yes. Income Tax and National Insurance are shown separately, along with your take-home pay.']
    ]
  });
}

function niPage() {
  const s = 35000;
  const rows = [15000, 25000, 35000, 50270, 60000, 80000, 100000].map(n => { const c = calc(n, UK); return [salLink(n), gbp(c.ni), gbp(c.ni / 12), pct(c.effectiveNiRate), n >= Y.niUEL ? '2%' : n > Y.niPT ? '8%' : '0%']; });
  const extra = sec(`${head(`National Insurance rates ${y}`, 'Employee Class 1 rates for category A, the standard letter for most employees.')}
${tableWrap(`Employee Class 1 NI, ${y}`, ['Earnings', 'Weekly', 'Monthly', 'Yearly', 'Rate'], [
    ['Below the Primary Threshold', 'Up to £242', 'Up to ' + gbp(1048), 'Up to ' + gbp(Y.niPT), '0%'],
    ['Between the thresholds', '£242 to £967', gbp(1048) + ' to ' + gbp(4189), gbp(Y.niPT) + ' to ' + gbp(Y.niUEL), '8%'],
    ['Above the Upper Earnings Limit', 'Over £967', 'Over ' + gbp(4189), 'Over ' + gbp(Y.niUEL), '2%']])}`) + sec(`${head('National Insurance by salary', 'Note how the effective rate barely moves above the Upper Earnings Limit, because the rate drops to 2%.')}
${tableWrap(`Employee NI on different salaries (${y})`, ['Salary', 'NI a year', 'NI a month', 'Effective NI rate', 'Rate on next £1'], rows, 2)}`) + sec(`${head('How National Insurance works')}<div class="prose">
<p>NI is built up through work and unlocks the State Pension and some benefits. You need 35 qualifying years for the full new State Pension and at least 10 to receive any. Earning above the Lower Earnings Limit gives you a qualifying year even if you pay no NI.</p>
<h3>NI category letters</h3><ul>
<li><strong>A</strong>: standard employees. This is what the calculator uses.</li><li><strong>B</strong>: certain married women and widows, at a reduced rate.</li><li><strong>C</strong>: employees over State Pension age pay no employee NI.</li><li><strong>H, M</strong>: apprentices under 25 and employees under 21 pay 0% up to the Upper Earnings Limit.</li></ul>
<p>Self-employed people pay Class 2 and Class 4 instead, which this calculator does not cover. Employers pay their own NI on top and it does not come out of your pay.</p></div>`);
  return calcPage({
    path: '/national-insurance-calculator/', salary: s, extra,
    title: `National Insurance Calculator UK ${y} – Employee NI Rates`,
    desc: `Calculate your employee Class 1 National Insurance for ${y}. See NI by weekly, monthly and yearly pay, plus thresholds, rates and category letters.`,
    h1: 'National Insurance Calculator UK', badge: `National Insurance ${y}`,
    lead: `Work out how much employee National Insurance comes out of your pay, and how it combines with Income Tax to shape your take-home.`,
    faqItems: [
      ['How much National Insurance will I pay?', `In ${y} you pay 8% on earnings between ${gbp(Y.niPT)} and ${gbp(Y.niUEL)}, and 2% above. On ${kfmt(s)} that is ${gbp(calc(s, UK).ni)} a year, or ${gbp(calc(s, UK).ni / 12)} a month.`],
      ['At what income do I start paying National Insurance?', `Once you earn over ${gbp(Y.niPT)} a year (${gbp(242)} a week or ${gbp(1048)} a month). This is the same as the Personal Allowance for most people.`],
      ['Does a pension reduce National Insurance?', 'Only salary sacrifice does. Net pay and relief-at-source contributions reduce or leave Income Tax alone but do not change the pay NI is charged on. Choose "Salary sacrifice" in the calculator to see the difference.'],
      ['Do I pay National Insurance on a bonus?', 'Yes. Bonuses count as pay for NI. Add a bonus under "More options" to see its effect.'],
      ['Is National Insurance the same in Scotland?', 'Yes. National Insurance is a UK-wide tax. Only Income Tax differs in Scotland.']
    ]
  });
}

function monthlyPage() {
  const s = 3500 * 12;
  const extra = sec(`${head('Monthly take-home pay by salary', `Gross monthly pay is your annual salary divided by 12. Take-home is what remains after tax and NI.`)}${monthlyTable([20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000, 100000], 0)}
<div class="callout"><p><strong>Why your first payslip can look different.</strong> Tax is worked out cumulatively across the tax year (6 April to 5 April) using your tax code, so a new starter or a code change can move a single month's tax up or down. Over a full year the total matches this calculator.</p></div>`);
  return calcPage({
    path: '/monthly-salary-calculator/', freq: 'monthly', salary: s, extra,
    title: `Monthly Salary Calculator UK ${y} – Monthly Pay After Tax`,
    desc: `Enter your monthly salary and see your UK monthly take-home pay after Income Tax and National Insurance for ${y}, with pension and student loan options.`,
    h1: 'Monthly Salary Calculator UK', badge: `Monthly pay ${y}`,
    lead: `Enter what you earn each month before tax and see the amount you actually receive, plus the annual salary it works out to.`,
    faqItems: [
      ['How do I calculate monthly salary after tax?', `Multiply your monthly pay by 12 to get the annual figure, work out Income Tax and National Insurance on that, subtract them, and divide by 12. The calculator does this instantly. For example ${kfmt(3500)} a month (${kfmt(42000)} a year) leaves ${gbp(calc(42000, UK).periods.monthly)} a month.`],
      ['Is monthly pay the same every month?', 'For a steady salary, roughly yes. Tax is calculated cumulatively, so one-off bonuses, tax code changes and part-year employment can change individual months.'],
      ['What is the monthly tax-free amount?', `Your ${gbp(Y.personalAllowance)} Personal Allowance is spread evenly as ${gbp(Y.personalAllowance / 12)} a month, and National Insurance starts above ${gbp(1048)} a month.`],
      ['Does this work for 4-weekly pay?', 'Not exactly. Four-weekly pay gives 13 pay days a year, not 12. Use the weekly calculator for a closer figure.']
    ]
  });
}

function weeklyPage() {
  const s = 700 * 52;
  const rows = [300, 400, 500, 600, 700, 800, 1000, 1500].map(w => { const c = calc(w * 52, UK); return [gbp(w), `<span class="e">-${gbp(c.tax / 52)}</span>`, `<span class="e">-${gbp(c.ni / 52)}</span>`, `<strong>${gbp(c.periods.weekly)}</strong>`, gbp(c.periods.monthly)]; });
  const extra = sec(`${head('Weekly take-home pay by weekly wage', 'Assumes 52 pay weeks a year and code 1257L.')}${tableWrap(`Weekly gross wage to weekly take-home (${y})`, ['Gross a week', 'Tax a week', 'NI a week', 'Take-home a week', 'Take-home a month'], rows, 4)}
<div class="callout"><p><strong>Weekly NI thresholds.</strong> For weekly pay, employee NI starts above £242 a week and drops to 2% above £967 a week. Tax-free pay is about ${gbp(Y.personalAllowance / 52)} a week.</p></div>`);
  return calcPage({
    path: '/weekly-salary-calculator/', freq: 'weekly', salary: s, extra,
    title: `Weekly Salary Calculator UK ${y} – Weekly Pay After Tax`,
    desc: `Calculate UK weekly take-home pay for ${y}. Enter your weekly wage and see Income Tax, National Insurance and net pay per week, month and year.`,
    h1: 'Weekly Salary Calculator UK', badge: `Weekly pay ${y}`,
    lead: `Paid weekly? Enter your gross weekly pay to see your take-home each week, and what it adds up to over a year.`,
    faqItems: [
      ['How much is a £700 weekly wage after tax?', `On ${kfmt(700)} a week (${kfmt(36400)} a year) you take home about ${gbp(calc(36400, UK).periods.weekly)} a week after ${gbp(calc(36400, UK).tax / 52)} tax and ${gbp(calc(36400, UK).ni / 52)} National Insurance.`],
      ['How many weeks does the calculator use?', 'It uses 52 weeks a year. Some years have 53 pay dates, which slightly changes individual weeks but not the annual figure.'],
      ['How is weekly tax calculated?', `Your annual allowance is divided into weekly amounts (about ${gbp(Y.personalAllowance / 52)}), and each week's pay is taxed after that using cumulative tax.`],
      ['Is weekly pay taxed differently to monthly?', 'The annual rules are the same, but National Insurance uses weekly thresholds (£242 and £967), so tiny rounding differences arise.']
    ]
  });
}

function hourlyPage() {
  const s = 20 * 37.5 * 52;
  const rates = [12, 15, 18, 20, 25, 30, 40, 50];
  const rows = rates.map(h => { const c = calc(h * 37.5 * 52, UK); return [gbp(h, 2), gbp(c.gross), gbp(c.net), `<strong>${gbp(c.periods.hourly, 2)}</strong>`, gbp(c.periods.monthly)]; });
  const hrs = [35, 37.5, 40, 45].map(h => { const c = calc(20 * h * 52, { ...UK, hoursPerWeek: h }); return [`${h} hours`, gbp(c.gross), gbp(c.net), gbp(c.periods.monthly)]; });
  const extra = sec(`${head('Hourly rate to take-home pay', 'Based on a 37.5-hour week, 52 weeks a year. Change the hours in the calculator for your own week.')}${tableWrap(`Hourly rate to hourly take-home (${y})`, ['Hourly rate', 'Annual gross', 'Annual take-home', 'Take-home an hour', 'Take-home a month'], rows, 3)}`) +
    sec(`${head('How your weekly hours change the result', `Same ${gbp(20, 2)} hourly rate, different hours.`)}${tableWrap(`${gbp(20, 2)} an hour by weekly hours`, ['Hours a week', 'Annual gross', 'Annual take-home', 'Take-home a month'], hrs, 1)}
<p style="color:var(--slate-2);max-width:760px">More hours mean more pay, and more of it lands in the 20% band as you cross the Personal Allowance, so take-home per hour stays broadly flat until you reach the higher-rate threshold.</p>`);
  return calcPage({
    path: '/hourly-salary-calculator/', freq: 'hourly', salary: s, extra,
    title: `Hourly Salary Calculator UK ${y} – Hourly Pay After Tax`,
    desc: `Enter your hourly rate and hours per week to see UK annual salary and hourly take-home pay after tax and National Insurance for ${y}.`,
    h1: 'Hourly Salary Calculator UK', badge: `Hourly pay ${y}`,
    lead: `Turn your hourly rate into an annual salary and see what you keep per hour, per week and per month after tax.`,
    faqItems: [
      ['How do I calculate hourly pay after tax?', `Multiply your rate by weekly hours and 52 weeks to get annual pay, work out tax and NI, then divide the net figure back by the same hours. At ${gbp(20, 2)} an hour for 37.5 hours you take home about ${gbp(calc(s, UK).periods.hourly, 2)} an hour.`],
      ['How many hours are in a working year?', 'The calculator uses your weekly hours times 52. A 37.5-hour week gives 1,950 hours; a 40-hour week gives 2,080.'],
      ['Is overtime taxed more?', 'No. Overtime is taxed as normal pay. It can push part of your income into a higher band, but only the pay above the threshold is taxed at the higher rate.'],
      ['What if my hours vary?', 'Use your average weekly hours, or enter your expected annual earnings on the Annual tab. Tax is worked out on total annual pay.']
    ]
  });
}

function afterTaxPage() {
  const s = 45000;
  const list = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000, 90000, 100000, 120000, 150000];
  const extra = sec(`${head(`Salary after tax by income (${y})`, 'Take-home pay for the most searched UK salaries. Click a salary for a full breakdown.')}${afterTaxTable(list)}`) +
    sec(`${head('How much of each extra £1 do you keep?')}<div class="stats">${[[20000, 'Basic rate'], [50000, 'Basic rate'], [60000, 'Higher rate'], [110000, 'Allowance taper']].map(([n, t]) => `<div class="card stat"><div class="stat-top"><span>At ${kfmt(n)}</span><span class="chip">${t}</span></div><div class="stat-val num c-green">${(100 - Math.round(E.marginalRate({ gross: n, taxCode: '1257L' }) * 100))}p</div><div class="stat-sub">kept from the next £1 (${mr(n)} goes in tax and NI)</div></div>`).join('')}</div>`);
  return calcPage({
    path: '/salary-after-tax-calculator/', salary: s, extra,
    title: `Salary After Tax Calculator UK ${y} – Annual Take-Home Pay`,
    desc: `See your UK salary after tax for ${y}. Enter your annual salary and get take-home pay after Income Tax, NI, pension and student loan.`,
    h1: 'Salary After Tax Calculator UK', badge: `Salary after tax ${y}`,
    lead: `Enter your gross annual salary to see your net salary after tax, how much of each extra pound you keep, and how you compare with other salary levels.`,
    faqItems: [
      ['How do I work out my salary after tax?', `Subtract your Personal Allowance (${gbp(Y.personalAllowance)}), apply 20% to the next ${gbp(Y.basicBand)}, 40% above that, then take off National Insurance. On ${kfmt(s)} that leaves ${gbp(calc(s, UK).net)}.`],
      ['What is the difference between gross and net salary?', 'Gross salary is your pay before any deductions. Net salary is what you keep after Income Tax, National Insurance and any pension or student loan deductions.'],
      ['Why do I keep a lower share on a higher salary?', 'Because each higher tax band applies only to the pay above its threshold, your effective rate rises gradually. The table above shows the share you keep at each level.'],
      ['Are these figures for the whole UK?', 'They use England, Wales and Northern Ireland rates. Choose Scotland in the calculator for Scottish Income Tax.']
    ]
  });
}

// ---- Salary pages (unique data on every page) ------------------------------------------------
function insights(n) {
  const r = calc(n, UK), M = mr(n);
  const room = Y.niUEL - n;
  const pen = (pctv, type) => calc(n, { ...UK, pensionPct: pctv, pensionType: type });
  const loans = p => calc(n, { ...UK, studentLoan: p }).studentLoan;
  switch (n) {
    case 30000: return {
      h2: `Where £30,000 sits in the UK tax system`,
      cards: [
        ['Comfortably basic rate', `Every pound between ${gbp(Y.personalAllowance)} and ${gbp(Y.niUEL)} is taxed at 20% plus 8% NI, so you keep 72p of each extra pound (${M} in deductions). You are ${gbp(room)} below the higher-rate threshold.`],
        ['Student loans bite early', `Your loan payment depends heavily on the plan. On £30,000: Plan 1 ${gbp(loans('plan1'))} a year, Plan 2 ${gbp(loans('plan2'))}, Plan 5 ${gbp(loans('plan5'))}, and a postgraduate loan ${gbp(calc(n, { ...UK, postgrad: true }).postgrad)}.`],
        ['Pension costs less than it looks', `A 5% pension is ${gbp(n * 0.05)} a year, but take-home falls by only ${gbp(r.net - pen(5, 'netpay').net)} through net pay, or ${gbp(r.net - pen(5, 'sacrifice').net)} through salary sacrifice, thanks to tax and NI relief.`]
      ] };
    case 40000: return {
      h2: `What £40,000 means for your take-home pay`,
      cards: [
        ['Just over £10,000 below higher rate', `You need a further ${gbp(room)} of pay before the 40% rate starts at ${gbp(Y.niUEL)}. Until then each extra pound keeps 72p (${M} deducted).`],
        [`Plan 2 costs about ${gbp(loans('plan2') / 12)} a month`, `A Plan 2 loan takes ${gbp(loans('plan2'))} a year (${gbp(loans('plan2') / 12)} a month) on £40,000, because you repay 9% of the ${gbp(n - Y.loans.plan2)} above the ${gbp(Y.loans.plan2)} threshold. That leaves ${gbp(calc(n, { ...UK, studentLoan: 'plan2' }).periods.monthly)} a month.`],
        ['A cushion for pension top-ups', `Paying 8% into a pension via salary sacrifice (${gbp(n * 0.08)} a year) reduces take-home by ${gbp(r.net - pen(8, 'sacrifice').net)}. You are unlikely to reach the higher-rate band, so relief is at 20% plus 8% NI.`]
      ] };
    case 50000: {
      const r55 = calc(55000, UK), gain = r55.net - r.net;
      return {
        h2: `The ${gbp(Y.niUEL)} cliff edge: what happens when you earn more`,
        cards: [
          [`You are ${gbp(room)} from higher rate`, `At £50,000 you are ${gbp(room)} below the ${gbp(Y.niUEL)} threshold. Above it your marginal rate steps from ${M} to ${mr(55000)}: 40% Income Tax plus 2% National Insurance.`],
          ['What a £5,000 raise really brings', `Moving to £55,000 adds ${gbp(gain)} a year (${gbp(gain / 12)} a month) to take-home, not ${gbp(5000)}. You keep ${pct(gain / 5000, 0)} of the rise because ${gbp(55000 - Y.niUEL)} of it is taxed at 40%.`],
          ['A pension shields the raise', `If offered £55,000, paying ${gbp(55000 - Y.niUEL)} into a pension keeps your taxable pay at ${gbp(Y.niUEL)}. Through salary sacrifice, take-home rises by ${gbp(calc(55000, { ...UK, sacrifice: 55000 - Y.niUEL }).net - r.net)} and the full sum still goes into your pension.`]
        ] };
    }
    case 60000: {
      const over = n - Y.niUEL;
      return {
        h2: `Higher-rate tax on £60,000`,
        cards: [
          ['You pay 40% on ' + gbp(over), `Your pay above ${gbp(Y.niUEL)} is taxed at 40% (${gbp(over * 0.4)}) plus 2% NI (${gbp(over * 0.02)}). Your marginal rate is ${M} and your effective rate is ${pct(r.effectiveTaxRate + r.effectiveNiRate)}.`],
          ['Child Benefit charge starts here', `The High Income Child Benefit Charge applies when adjusted net income goes over £60,000 and rises to 100% of the benefit at £80,000. At exactly £60,000 there is no charge, but your next pay rise starts it.`],
          ['Pension gets 40% relief', `A 10% pension (${gbp(n * 0.1)}) paid via net pay reduces take-home by only ${gbp(r.net - pen(10, 'netpay').net)}, because most of it saves tax at 40%. It also lowers adjusted net income for the Child Benefit charge.`]
        ] };
    }
    case 100000: {
      const r110 = calc(110000, UK), r110s = calc(110000, { ...UK, sacrifice: 10000 });
      return {
        h2: `The £100,000 tax trap`,
        cards: [
          ['Your allowance starts shrinking above this', `Above £100,000 you lose £1 of Personal Allowance for every £2 earned. At £110,000 your allowance is ${gbp(r110.personalAllowance)} and the marginal rate is ${mr(110000)}, including NI. Until ${gbp(Y.additionalStart)} the loss of allowance makes 40% tax act like 60%.`],
          ['A £10,000 raise is worth just ' + gbp(r110.net - r.net), `Moving to £110,000 lifts take-home by ${gbp(r110.net - r.net)} a year, a ${pct((r110.net - r.net) / 10000, 0)} share. Taking the same £10,000 as a salary-sacrifice pension leaves take-home at ${gbp(r110s.net)} (versus ${gbp(r.net)} today) while ${gbp(10000)} goes into your pension.`],
          ['Childcare support ends at £100,000', `Tax-Free Childcare and the 30-hour free childcare offer are lost once a parent's adjusted net income goes over £100,000, so pension contributions that bring you back under the line can be worth far more than the tax relief.`]
        ] };
    }
  }
}

function salaryPage(n) {
  const path = salaryPath(n), name = `${kfmt(n)} Salary After Tax`;
  const r = calc(n, UK), sc = calc(n, { ...UK, region: 'scotland' });
  const ins = insights(n);
  const nr = n => calc(n, UK);
  const glance = `<p class="lead" style="max-width:820px">On a ${kfmt(n)} salary in England, Wales or Northern Ireland you take home <strong>${gbp(r.net)} a year</strong> in ${y}: ${gbp(r.periods.monthly)} a month, ${gbp(r.periods.weekly)} a week or ${gbp(r.periods.hourly, 2)} an hour on a 37.5-hour week. You pay ${gbp(r.tax)} Income Tax and ${gbp(r.ni)} National Insurance, so you keep ${pct(r.keptRate)} of your gross pay.</p>`;

  // Scenario table
  const scen = [['Standard (code 1257L, no deductions)', {}], ['5% pension (salary sacrifice)', { pensionPct: 5, pensionType: 'sacrifice' }], ['5% pension (net pay)', { pensionPct: 5, pensionType: 'netpay' }],
    ['Plan 2 student loan', { studentLoan: 'plan2' }], ['Plan 5 student loan', { studentLoan: 'plan5' }], ['Postgraduate loan', { postgrad: true }]];
  const scenRows = scen.map(([label, o], i) => { const c = calc(n, { ...UK, ...o }); const d = c.net - r.net; return [label, gbp(c.net), `<strong>${gbp(c.periods.monthly)}</strong>`, i ? `<span class="${d < 0 ? 'e' : 'g'}">${d < 0 ? '-' : '+'}${gbp(Math.abs(d))}</span>` : '–']; });

  // Budget
  const m = r.periods.monthly;
  const budget = `<div class="budget">${[['Needs', 50, 'Rent or mortgage, council tax, energy, food, transport and insurance.'], ['Wants', 30, 'Eating out, subscriptions, hobbies, holidays and shopping.'], ['Savings & debt', 20, 'Emergency fund, ISA, pension top-ups and extra debt payments.']].map(([t, p, d]) =>
    `<div class="card"><div class="top"><span>${t}</span><span>${p}%</span></div><b class="big num">${gbp(m * p / 100)} <small style="font:500 14px var(--body);color:var(--slate)">/ month</small></b><div class="meter"><i style="width:${p}%"></i></div><p>${d}</p></div>`).join('')}</div>`;

  // Regions
  const dTax = sc.tax - r.tax;
  const reg = tableWrap(`England, Wales &amp; NI vs Scotland on ${kfmt(n)} (${y})`, ['', 'England, Wales &amp; NI', 'Scotland', 'Difference'], [
    ['Gross pay', gbp(n), gbp(n), '–'],
    ['Income Tax', gbp(r.tax), gbp(sc.tax), `<span class="${dTax > 0 ? 'e' : 'g'}">${dTax > 0 ? '+' : '-'}${gbp(Math.abs(dTax))}</span>`],
    ['National Insurance', gbp(r.ni), gbp(sc.ni), '£0 (UK-wide)'],
    ['Effective tax rate', pct(r.effectiveTaxRate), pct(sc.effectiveTaxRate), '–'],
    ['Take-home a year', `<strong>${gbp(r.net)}</strong>`, `<strong>${gbp(sc.net)}</strong>`, `<span class="${sc.net < r.net ? 'e' : 'g'}">${sc.net < r.net ? '-' : '+'}${gbp(Math.abs(sc.net - r.net))}</span>`],
    ['Take-home a month', gbp(r.periods.monthly), gbp(sc.periods.monthly), `<span class="${sc.net < r.net ? 'e' : 'g'}">${sc.net < r.net ? '-' : '+'}${gbp(Math.abs(sc.periods.monthly - r.periods.monthly))}</span>`]], 4);

  // Milestones
  const offs = [-10000, -5000, 0, 5000, 10000, 20000].map(d => n + d).filter(v => v >= 10000);
  const miles = `<div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${offs.map(v => { const c = nr(v), d = c.net - r.net;
    const inner = `<div><small>${v === n ? 'This page' : v < n ? `${kfmt(n - v)} lower` : `${kfmt(v - n)} higher`}</small><b>${kfmt(v)}</b><small><strong>${gbp(c.net)}</strong> net</small><br><small>${gbp(c.periods.monthly)} / mo${v === n ? '' : ` (${d < 0 ? '-' : '+'}${gbp(Math.abs(d / 12))})`}</small></div>`;
    return LIVE.has(salaryPath(v)) && v !== n ? `<a class="tile" href="${salaryPath(v)}">${inner}</a>` : `<div class="tile${v === n ? ' cur' : ''}">${inner}</div>`; }).join('')}</div>`;

  const f = faq([
    [`How much is ${kfmt(n)} a year after tax in the UK?`, `In ${y}, ${kfmt(n)} leaves ${gbp(r.net)} a year after ${gbp(r.tax)} Income Tax and ${gbp(r.ni)} National Insurance in England, Wales and Northern Ireland. That is ${gbp(r.periods.monthly)} a month.`],
    [`How much is ${kfmt(n)} a month after tax?`, `About ${gbp(r.periods.monthly)} a month, or ${gbp(r.periods.weekly)} a week, assuming tax code 1257L and no pension or student loan.`],
    [`What is the hourly rate for ${kfmt(n)}?`, `Before tax, ${kfmt(n)} is ${gbp(r.periods.grossHourly, 2)} an hour on a 37.5-hour week (${gbp(n / (52 * 40), 2)} on 40 hours). After tax it is ${gbp(r.periods.hourly, 2)} an hour.`],
    [`What tax band is ${kfmt(n)} in?`, n > Y.additionalStart ? `Additional rate.` : n > Y.niUEL ? `The higher-rate band. Your pay above ${gbp(Y.niUEL)} is taxed at 40%, and your marginal rate including NI is ${mr(n)}.` : `The basic-rate band. You pay 20% on pay over ${gbp(Y.personalAllowance)}, and your marginal rate including 8% NI is ${mr(n)}.`],
    [`How much less would I take home in Scotland on ${kfmt(n)}?`, dTax > 0 ? `About ${gbp(dTax)} a year less, because Scottish Income Tax is ${gbp(dTax)} higher on this salary in ${y}.` : `Scottish taxpayers on ${kfmt(n)} pay ${gbp(Math.abs(dTax))} less Income Tax in ${y} than in the rest of the UK.`],
    [`Does a student loan change ${kfmt(n)} after tax?`, `Yes. A Plan 2 loan would take ${gbp(calc(n, { ...UK, studentLoan: 'plan2' }).studentLoan)} a year on this salary, leaving ${gbp(calc(n, { ...UK, studentLoan: 'plan2' }).net)}. Use the calculator above to try your own plan.`]
  ]);

  const desc = `${kfmt(n)} a year after tax in the UK (${y}): ${gbp(r.net)} take-home, ${gbp(r.periods.monthly)} a month. See tax, National Insurance, pension and student loan effects.`;
  const title = `${kfmt(n)} Salary After Tax UK ${y}: ${gbp(r.periods.monthly)} a Month`;
  const idx = SALARIES.indexOf(n);
  const rel = ['/', '/take-home-pay-calculator/', '/income-tax-calculator/', '/national-insurance-calculator/', '/monthly-salary-calculator/', ...[SALARIES[idx - 1], SALARIES[idx + 1]].filter(Boolean).map(salaryPath), '/tax-brackets-uk/'];
  const crumbs = [['Home', '/'], ['Salary After Tax', '/salary-after-tax-calculator/'], [name, path]].filter(c => LIVE.has(c[1]));
  const body = `${crumbsHtml(crumbs)}
${hero({ badge: `HMRC ${y} tax year`, h1: `${name} UK`, lead: '' }).replace('<p class="lead"></p>', '')}
<div class="container">${glance}</div>
${calcOpen({ salary: n, freq: 'annual' })}
${sec(calcWidget({ salary: n, formTitle: `${kfmt(n)} salary parameters` }))}
${statsSection(n, `Your ${kfmt(n)} salary breakdown`)}
${sec(`${head(ins.h2)}<div class="cols3">${ins.cards.map(([h, p]) => `<div class="card"><h3 style="font-size:18px">${h}</h3><p style="margin:0;color:var(--slate-2);font-size:15px">${p}</p></div>`).join('')}</div>`)}
${sec(`${head(`How deductions change take-home on ${kfmt(n)}`, 'The same salary with the most common deductions. Use the calculator to build your own combination.')}${tableWrap(`${kfmt(n)} salary: take-home with different deductions (${y})`, ['Scenario', 'Take-home a year', 'Take-home a month', 'Change a year'], scenRows, 0)}`)}
${sec(`${head(`A realistic monthly budget on ${kfmt(n)} (${gbp(m)} a month)`, 'The popular 50/30/20 rule applied to your take-home pay. It is a starting point, not a rule. Housing costs vary hugely by region.')}${budget}`)}
${sec(`${head(`England vs Scotland on ${kfmt(n)}`, `Scotland sets its own Income Tax bands. National Insurance is the same everywhere.`)}${reg}`)}
${sec(`${head('Compare nearby salaries', 'How take-home pay changes as your salary moves up or down.')}${miles}`)}
${compareSection(n)}
${bandsSection(n)}
${faqSection(f)}
${related(rel)}
${ctaSection(`Calculate any salary, not just ${kfmt(n)}`, 'Add your pension, student loan and Scottish tax to get a figure that fits your payslip.')}
${trustSection()}
${calcClose}`;
  return layout({ path, title, desc, h1: `${name} UK`, body, calcPage: true, crumbs, ld: [webApp(path, name, desc), f.ld] });
}

// ---- Tax brackets hub ----------------------------------------------------------------------
function taxBracketsPage() {
  const path = '/tax-brackets-uk/';
  const cum = [30000, 50270, 75000, 100000, 125140, 150000].map(n => { const c = calc(n, UK); return [kfmt(n), gbp(c.tax), gbp(c.ni), pct(c.effectiveTaxRate), mr(n)]; });
  const scot = Y.scotland.map((b, i) => { let from = Y.personalAllowance; for (let j = 0; j < i; j++) from += Y.scotland[j].width; return [b.name, (b.rate * 100).toFixed(0) + '%', gbp(from + 1), isFinite(b.width) ? gbp(from + b.width) : 'and above']; });
  const f = faq([
    [`What are the UK tax brackets for ${y}?`, `In England, Wales and Northern Ireland: 0% up to ${gbp(Y.personalAllowance)}, 20% to ${gbp(Y.niUEL)}, 40% to ${gbp(Y.additionalStart)}, and 45% above. Scotland has six bands from 19% to 48%.`],
    ['Do I pay the higher rate on all my income if I earn over £50,270?', `No. Only the part above ${gbp(Y.niUEL)} is taxed at 40%. Someone on £60,000 pays 20% on the first ${gbp(Y.basicBand)} of taxable income and 40% only on the remaining ${gbp(60000 - Y.niUEL)}.`],
    ['Have the thresholds changed?', `The main thresholds (${gbp(Y.personalAllowance)} allowance and ${gbp(Y.niUEL)} higher-rate threshold) are unchanged from 2025/26. The Government has said they stay frozen until April 2031, which pulls more people into higher rates as pay rises. Scottish thresholds do change.`],
    ['Are Welsh tax rates different?', 'Wales can set its own rates but they currently match England.'],
    ['Where can I check official rates?', `See GOV.UK's "Income Tax rates and Personal Allowances" page and gov.scot for Scottish Income Tax. ${link('/about/', 'Our methodology')} lists our sources.`]
  ]);
  const body = `${crumbsHtml(breadcrumb(path, 'UK Tax Brackets'))}
${hero({ badge: `Tax year ${y}`, h1: 'UK Tax Brackets', lead: `Every Income Tax and National Insurance band for ${y} in one place, with worked examples of what each band costs in real pounds.` })}
${sec(`${head(`Income Tax bands ${y}`, 'Tax is charged in slices: each rate applies only to the pay within that band.')}<div class="cols2">
${tableWrap(`England, Wales &amp; Northern Ireland ${y}`, ['Band', 'Rate', 'Taxable income'], [['Personal Allowance', '0%', `Up to ${gbp(Y.personalAllowance)}`], ['Basic rate', '20%', `${gbp(Y.personalAllowance + 1)} to ${gbp(Y.niUEL)}`], ['Higher rate', '40%', `${gbp(Y.niUEL + 1)} to ${gbp(Y.additionalStart)}`], ['Additional rate', '45%', `Over ${gbp(Y.additionalStart)}`]])}
${tableWrap(`Scotland ${y}`, ['Band', 'Rate', 'From', 'To'], scot)}</div>`)}
${sec(`${head('National Insurance bands', 'Employee Class 1, category A.')}${tableWrap(`Employee National Insurance ${y}`, ['Yearly pay', 'Rate'], [[`Up to ${gbp(Y.niPT)}`, '0%'], [`${gbp(Y.niPT)} to ${gbp(Y.niUEL)}`, '8%'], [`Over ${gbp(Y.niUEL)}`, '2%']])}`)}
${sec(`${head('What the bands cost in pounds', 'Total tax and NI at key points on the ladder (England, Wales & NI, code 1257L).')}${tableWrap(`Tax and NI at key salaries (${y})`, ['Salary', 'Income Tax', 'National Insurance', 'Effective tax rate', 'Rate on next £1 (tax + NI)'], cum)}
<div class="callout warn"><p><strong>Why the effective rate jumps at £100,000.</strong> Between £100,000 and ${gbp(Y.additionalStart)} you lose £1 of Personal Allowance for every £2 of extra pay, so the rate on your next pound is about ${mr(110000)} including NI.</p></div>`)}
${sec(`${head('Try the bands with your own salary')}<div class="related">${links(['/', '/income-tax-calculator/', '/national-insurance-calculator/', '/take-home-pay-calculator/', '/salary-after-tax-calculator/'], '')}</div>`)}
${faqSection(f)}
${trustSection()}`;
  return layout({ path, title: `UK Tax Brackets ${y} – Income Tax & NI Rates by Band`, desc: `UK income tax brackets and National Insurance bands for ${y}, including Scotland, with worked examples of tax at £30k, £50k, £100k and £150k.`, h1: 'UK Tax Brackets', body, crumbs: breadcrumb(path, 'UK Tax Brackets'), ld: [f.ld] });
}

// ---- About / methodology -----------------------------------------------------------------------
function aboutPage() {
  const path = '/about/';
  const body = `${crumbsHtml(breadcrumb(path, 'About & Methodology'))}
${hero({ h1: 'About and methodology', lead: `How ${SITE.name} works out your take-home pay, what it assumes, and where its rates come from.` })}
${sec(`<div class="prose">
<h2>What the calculator does</h2><p>It takes your gross pay and applies ${y} Income Tax (including Scottish bands), employee Class 1 National Insurance, optional pension and salary sacrifice, and student and postgraduate loan repayments. The same code produces the figures you see on every page and the live results in the calculator.</p>
<h2>What it assumes</h2><ul>
<li>A steady annual salary, paid over a full tax year with no gaps.</li>
<li>Standard tax code 1257L unless you enter a different code. The £100,000 allowance taper is applied automatically to the standard code.</li>
<li>National Insurance category A (most employees). Self-employed Class 2 and 4 are not covered.</li>
<li>Monthly, weekly, daily and hourly figures are the annual figure divided by 12, 52, 260 and (52 × your weekly hours).</li>
<li>Tax and NI are calculated on annual pay rather than pay period by pay period, so a real payslip can differ slightly, especially for irregular pay.</li></ul>
<h2>What it does not include</h2><p>Benefits in kind (P11D), the High Income Child Benefit Charge, Marriage Allowance, Blind Person's Allowance, savings and dividend tax, and employer NI.</p>
<h2>Where the rates come from</h2><ul>
<li>Income Tax, National Insurance and student loan thresholds: GOV.UK "Rates and thresholds for employers ${y}" and "Income Tax rates and Personal Allowances".</li>
<li>Scottish Income Tax bands: gov.scot "Scottish Income Tax: rates and bands".</li></ul>
<p>Rates last reviewed: ${SITE.built}. Always check GOV.UK for the latest official figures.</p>
<h2>Privacy</h2><p>Calculations run in your browser. The figures you enter are not stored or sent to a server.</p>
<h2>Disclaimer</h2><p>This tool gives estimates for general planning and is not financial, tax or legal advice. Speak to a qualified adviser or HMRC about your own circumstances.</p>
</div>`)}`;
  return layout({ path, title: `About & Methodology – ${SITE.name}`, desc: `How ${SITE.name} calculates UK take-home pay: assumptions, sources and limitations for ${y}.`, h1: 'About and methodology', body, crumbs: breadcrumb(path, 'About & Methodology') });
}


// ---- Legal pages (noindex, excluded from sitemap) ----------------------------------------------------
function legalPage(path, name, lead, inner) {
  const body = `${crumbsHtml(breadcrumb(path, name))}
${hero({ h1: name, lead })}
${sec(`<div class="prose">${inner}<p>Last updated: ${SITE.built}.</p></div>`)}`;
  return layout({ path, title: `${name} – ${SITE.name}`, desc: `${name} for ${SITE.name}.`, h1: name, body, crumbs: breadcrumb(path, name), noindex: true });
}
const contactLine = `<p>Questions about this page? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`;
function privacyPage() {
  return legalPage('/privacy-policy/', 'Privacy Policy', `How ${SITE.name} handles your information.`, `
<h2>Calculator inputs</h2><p>The salary, pension and student loan figures you enter are processed in your browser. They are not sent to our servers or stored by us.</p>
<h2>Information we collect</h2><p>We do not ask you to create an account and we do not collect your name or contact details through the calculators. If you email us, we receive your email address and the contents of your message and use them only to reply.</p>
<h2>Hosting and logs</h2><p>The site is hosted on Vercel, which may process technical data such as your IP address, browser type and the pages requested, in server logs for security and performance.</p>
<h2>Advertising and cookies</h2><p>We use Google AdSense to display advertising. Google, as a third-party vendor, uses cookies (including the DoubleClick cookie) to serve ads based on your visits to this site and other sites on the internet. You can turn off personalised advertising in <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>, and you can opt out of some third-party vendors&rsquo; use of cookies for personalised advertising at <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>. You can read how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>. Where the law requires it, for example in the UK and the European Economic Area, we will ask for your consent before setting advertising cookies.</p>
<h2>Your rights</h2><p>Under UK GDPR you can ask what personal data we hold about you, and ask us to correct or delete it. Contact us using the email below.</p>
<h2>Changes</h2><p>We may update this policy from time to time. The date at the bottom shows when it last changed.</p>
${contactLine}`);
}
function termsPage() {
  return legalPage('/terms-of-service/', 'Terms of Service', `The terms for using ${SITE.name}.`, `
<h2>Using the site</h2><p>${SITE.name} is a free tool that provides estimates of UK take-home pay. By using it you agree to these terms.</p>
<h2>Estimates only</h2><p>Results are estimates based on the assumptions described on our ${link('/about/', 'methodology page')}. They are not a payslip, a tax return or a guarantee of what you will receive.</p>
<h2>No advice</h2><p>Nothing on this site is financial, tax, legal or employment advice. Check figures with HMRC, GOV.UK or a qualified adviser before you rely on them.</p>
<h2>Accuracy</h2><p>We aim to keep rates and thresholds up to date but do not promise that the site is free of errors or omissions, or that it will always be available.</p>
<h2>Liability</h2><p>To the fullest extent the law allows, we are not liable for any loss arising from your use of, or reliance on, the site. Nothing here limits liability that cannot lawfully be limited.</p>
<h2>Intellectual property</h2><p>The content and design of the site belong to ${SITE.name}. You may link to it, but please do not copy it wholesale.</p>
<h2>Changes</h2><p>We may change the site or these terms at any time. Continued use means you accept the updated terms.</p>
${contactLine}`);
}
function disclaimerPage() {
  return legalPage('/disclaimer/', 'Disclaimer', `Please read before relying on any figure from ${SITE.name}.`, `
<h2>Not financial or tax advice</h2><p>${SITE.name} provides general information and estimates only. It is not financial, tax, legal or employment advice, and it does not replace advice from a qualified professional.</p>
<h2>Your figures may differ</h2><p>Your real take-home pay depends on your tax code, pay period, employer pension scheme, benefits in kind, student loan timing and other personal circumstances that the calculator cannot see.</p>
<h2>Official sources</h2><p>Always confirm rates and thresholds with GOV.UK, HMRC and, for Scottish Income Tax, gov.scot. If a figure here differs from an official source, the official source is correct.</p>
<h2>Third-party links</h2><p>Any external links are provided for convenience. We are not responsible for the content of other websites.</p>
${contactLine}`);
}


// ---- Contact (indexable) ----------------------------------------------------------------------------
function contactPage() {
  const path = '/contact/';
  const body = `${crumbsHtml(breadcrumb(path, 'Contact'))}
${hero({ h1: 'Contact', lead: `Questions, corrections and suggestions for ${SITE.name}.` })}
${sec(`<div class="prose">
<p>We read every message. The quickest way to reach us is email:</p>
<p><strong><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></strong></p>
<h2>What to write to us about</h2><ul>
<li>A tax rate, threshold or figure that looks out of date or wrong. Please include the page and a link to the official GOV.UK or gov.scot source if you have one.</li>
<li>A bug or something that does not work in a calculator, with your browser and device.</li>
<li>A calculator or guide you would like to see.</li>
<li>Privacy questions or requests. See our ${link('/privacy-policy/', 'privacy policy')}.</li></ul>
<h2>What we cannot do</h2><p>We cannot give personal tax, legal or employment advice, and we cannot see or change your payslip. For questions about your own tax code or deductions, contact your employer&rsquo;s payroll team, HMRC or a qualified adviser.</p>
<h2>Response time</h2><p>We aim to reply within a few working days.</p>
</div>`)}`;
  return layout({ path, title: `Contact – ${SITE.name}`, desc: `Contact ${SITE.name} with questions, corrections or suggestions.`, h1: 'Contact', body, crumbs: breadcrumb(path, 'Contact') });
}

// ---- Registry ---------------------------------------------------------------------------------------
export function buildAll() {
  const pages = {
    '/': homePage(), '/take-home-pay-calculator/': takeHomePage(), '/income-tax-calculator/': incomeTaxPage(),
    '/national-insurance-calculator/': niPage(), '/monthly-salary-calculator/': monthlyPage(), '/weekly-salary-calculator/': weeklyPage(),
    '/hourly-salary-calculator/': hourlyPage(), '/salary-after-tax-calculator/': afterTaxPage(),
    '/tax-brackets-uk/': taxBracketsPage(), '/about/': aboutPage(),
    '/contact/': contactPage(), '/privacy-policy/': privacyPage(), '/terms-of-service/': termsPage(), '/disclaimer/': disclaimerPage()
  };
  for (const n of SALARIES) pages[salaryPath(n)] = salaryPage(n);
  return pages;
}
