import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const E = createRequire(import.meta.url)('../src/engine.js');

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
const calc = (gross, o = {}) => E.calculate({ gross, ...o });

// Expected values are worked out by hand from the HMRC 2026/27 rules.
test('£30,000 rest of UK', () => {
  const r = calc(30000);
  near(r.tax, 3486); near(r.ni, 1394.4); near(r.net, 25119.6);
});

test('£50,000 rest of UK', () => {
  const r = calc(50000);
  near(r.tax, 7486); near(r.ni, 2994.4); near(r.net, 39519.6);
});

test('£100,000 keeps full allowance', () => {
  const r = calc(100000);
  near(r.tax, 27432); near(r.ni, 4010.6); assert.equal(r.personalAllowance, 12570);
});

test('£110,000 personal allowance tapers to £7,570', () => {
  const r = calc(110000);
  assert.equal(r.personalAllowance, 7570); near(r.tax, 33432); near(r.ni, 4210.6);
});

test('£125,140 loses the whole allowance', () => {
  const r = calc(125140);
  assert.equal(r.personalAllowance, 0); near(r.tax, 42516);
});

test('60% trap between £100k and £125,140', () => {
  const m = E.marginalRate({ gross: 110000 }, 100);
  near(m, 0.62, 0.005); // 40% + 20% taper effect + 2% NI
});

test('marginal rate steps at the higher-rate threshold', () => {
  near(E.marginalRate({ gross: 40000 }), 0.28, 0.001);
  near(E.marginalRate({ gross: 60000 }), 0.42, 0.001);
});

test('Plan 2 student loan 2026/27 threshold £29,385', () => {
  near(calc(40000, { studentLoan: 'plan2' }).studentLoan, 955.35);
  assert.equal(calc(29000, { studentLoan: 'plan2' }).studentLoan, 0);
});

test('postgraduate loan 6% over £21,000', () => {
  near(calc(31000, { postgrad: true }).postgrad, 600);
});

test('Scottish taxpayer at £50,000 (2026/27 bands)', () => {
  near(calc(50000, { region: 'scotland' }).tax, 8982.05);
});

test('Scottish tax equals rest of UK tax bands only above the higher-rate split', () => {
  // Low earner: starter/basic bands are below rest-of-UK 20%.
  const s = calc(15000, { region: 'scotland' }), u = calc(15000);
  assert.ok(s.tax < u.tax);
});

test('2025/26 Scottish bands are selectable', () => {
  // taxable 37,430: 2827*.19 + 12094*.2 + 16171*.21 + (37430-31092)*.42 = 537.13+2418.8+3395.91+2661.96
  near(calc(50000, { region: 'scotland', taxYear: '2025-26' }).tax, 9013.8);
});

test('salary-sacrifice pension cuts tax AND NI, net-pay only tax', () => {
  const sac = calc(50000, { pensionPct: 5, pensionType: 'sacrifice' });
  const np = calc(50000, { pensionPct: 5, pensionType: 'netpay' });
  near(sac.ni, (50000 * 0.95 - 12570) * 0.08 + 0, 1); // below UEL after sacrifice
  near(np.ni, 2994.4);
  near(np.tax, (47500 - 12570) * 0.2 + 0, 0.01);
  assert.ok(sac.net > np.net);
});

test('relief at source: member pays 80% and bands extend', () => {
  const r = calc(60000, { pensionPct: 5, pensionType: 'ras' });
  // C = 3000, gross 3750 extends basic band to 41,450; taxable 47,430.
  near(r.pension, 3000);
  near(r.tax, 41450 * 0.2 + (47430 - 41450) * 0.4);
});

test('bonus and sacrifice combine into gross', () => {
  const r = calc(40000, { bonus: 5000, sacrifice: 2000 });
  assert.equal(r.gross, 45000);
  near(r.tax, (43000 - 12570) * 0.2);
});

test('tax code parsing', () => {
  assert.equal(E.parseTaxCode('1257L', '2026-27').pa, 12570);
  assert.equal(E.parseTaxCode('S1257L', '2026-27').kind, 'standard');
  assert.equal(E.parseTaxCode('1100L', '2026-27').pa, 11009);
  assert.equal(E.parseTaxCode('K100', '2026-27').pa, -1009);
  assert.equal(E.parseTaxCode('BR', '2026-27').rate, 0.2);
  assert.equal(E.parseTaxCode('nonsense', '2026-27').ok, false);
});

test('BR code taxes everything at 20%', () => {
  near(calc(20000, { taxCode: 'BR' }).tax, 4000);
});

test('period conversions round-trip', () => {
  for (const f of ['monthly', 'weekly', 'daily', 'hourly']) {
    near(E.toAnnual(E.fromAnnual(52000, f, 40), f, 40), 52000, 1e-6);
  }
});

test('zero and junk input do not throw or go negative', () => {
  const r = E.calculate({ gross: 'abc', pensionPct: 500 });
  assert.equal(r.net, 0);
  assert.ok(calc(5000).net >= 0);
});

test('currency formatting', () => {
  assert.equal(E.gbp(39498.4), '£39,498');
  assert.equal(E.gbp(-6486), '-£6,486');
  assert.equal(E.gbp(18.723, 2), '£18.72');
});
