/*
 * Salary Calculator UK - shared calculation engine.
 * Runs unchanged in Node (static build) and in the browser (live calculator),
 * so page text and live results can never disagree.
 * All figures are annual, in pounds. Employee Class 1 NI category A only.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SalaryEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- Rates ---------------------------------------------------------------
  // Scottish bands are stored as WIDTHS of taxable income (after personal
  // allowance), which is how HMRC applies them.
  var YEARS = {
    '2026-27': {
      label: '2026/27',
      personalAllowance: 12570,
      taperStart: 100000,
      basicBand: 37700,
      additionalStart: 125140,
      niPT: 12570, niUEL: 50270, niMain: 0.08, niUpper: 0.02,
      loans: { plan1: 26900, plan2: 29385, plan4: 33795, plan5: 25000 },
      pgThreshold: 21000,
      scotland: [
        { name: 'Starter', rate: 0.19, width: 3967 },     // to £16,537
        { name: 'Basic', rate: 0.20, width: 12989 },       // to £29,526
        { name: 'Intermediate', rate: 0.21, width: 14136 },// to £43,662
        { name: 'Higher', rate: 0.42, width: 31338 },      // to £75,000
        { name: 'Advanced', rate: 0.45, width: 50140 },    // to £125,140
        { name: 'Top', rate: 0.48, width: Infinity }
      ]
    },
    '2025-26': {
      label: '2025/26',
      personalAllowance: 12570,
      taperStart: 100000,
      basicBand: 37700,
      additionalStart: 125140,
      niPT: 12570, niUEL: 50270, niMain: 0.08, niUpper: 0.02,
      loans: { plan1: 26065, plan2: 28470, plan4: 32745, plan5: 25000 },
      pgThreshold: 21000,
      scotland: [
        { name: 'Starter', rate: 0.19, width: 2827 },     // to £15,397
        { name: 'Basic', rate: 0.20, width: 12094 },       // to £27,491
        { name: 'Intermediate', rate: 0.21, width: 16171 },// to £43,662
        { name: 'Higher', rate: 0.42, width: 31338 },      // to £75,000
        { name: 'Advanced', rate: 0.45, width: 50140 },    // to £125,140
        { name: 'Top', rate: 0.48, width: Infinity }
      ]
    }
  };
  var DEFAULT_YEAR = '2026-27';
  var LOAN_RATE = 0.09, PG_RATE = 0.06;
  var LOAN_NAMES = {
    none: 'No student loan', plan1: 'Plan 1', plan2: 'Plan 2', plan4: 'Plan 4 (Scotland)', plan5: 'Plan 5'
  };

  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : (d || 0); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  // ---- Tax code ------------------------------------------------------------
  // Supports NNNN[L|M|N|T], K codes, BR, D0, D1, 0T, NT with optional S/C prefix.
  function parseTaxCode(raw, year) {
    var std = YEARS[year].personalAllowance;
    var code = String(raw == null ? '' : raw).toUpperCase().replace(/\s+/g, '');
    if (!code) return { ok: true, kind: 'standard', pa: std, code: '' };
    var scottishPrefix = /^S/.test(code), welshPrefix = /^C/.test(code);
    var body = code.replace(/^[SC]/, '');
    var m;
    if (body === 'NT') return { ok: true, kind: 'nt', pa: 0, code: code, scottishPrefix: scottishPrefix };
    if (body === 'BR') return { ok: true, kind: 'flat', rate: 0.20, pa: 0, code: code, scottishPrefix: scottishPrefix };
    if (body === 'D0') return { ok: true, kind: 'flat', rate: 0.40, pa: 0, code: code, scottishPrefix: scottishPrefix };
    if (body === 'D1') return { ok: true, kind: 'flat', rate: 0.45, pa: 0, code: code, scottishPrefix: scottishPrefix };
    if (body === '0T') return { ok: true, kind: 'allowance', pa: 0, code: code, scottishPrefix: scottishPrefix };
    if ((m = /^K(\d{1,4})$/.exec(body))) {
      return { ok: true, kind: 'k', pa: -(parseInt(m[1], 10) * 10 + 9), code: code, scottishPrefix: scottishPrefix };
    }
    if ((m = /^(\d{1,4})[LMNT]$/.exec(body))) {
      var pa = parseInt(m[1], 10) * 10 + 9;
      // Codes are written in tens, so 1257L means £12,570 (the +9 is HMRC's rounding convention).
      if (parseInt(m[1], 10) === Math.round(std / 10)) pa = std;
      return { ok: true, kind: pa === std ? 'standard' : 'allowance', pa: pa, code: code, scottishPrefix: scottishPrefix };
    }
    return { ok: false, kind: 'standard', pa: std, code: code };
  }

  // ---- Income tax ----------------------------------------------------------
  // taxablePay: pay liable to income tax (after sacrifice / net-pay pension).
  // adjustedNet: income used for the £100k taper (taxablePay minus gross RAS pension).
  // bandExtension: RAS gross contribution, extending the basic and higher bands.
  function incomeTax(taxablePay, opts) {
    var Y = opts.Y, tc = opts.taxCode, ext = opts.bandExtension || 0;
    var bands = [], tax = 0, pa;
    if (taxablePay <= 0) return { tax: 0, bands: bands, personalAllowance: tc.pa > 0 ? tc.pa : 0 };

    if (tc.kind === 'nt') {
      return { tax: 0, bands: [{ name: 'No tax (NT code)', rate: 0, from: 0, to: taxablePay, amount: taxablePay, tax: 0 }], personalAllowance: taxablePay };
    }
    if (tc.kind === 'flat') {
      tax = taxablePay * tc.rate;
      return { tax: tax, bands: [{ name: tc.code + ' flat rate', rate: tc.rate, from: 0, to: taxablePay, amount: taxablePay, tax: tax }], personalAllowance: 0 };
    }

    if (tc.kind === 'standard') {
      var adjusted = opts.adjustedNet;
      pa = Y.personalAllowance;
      if (adjusted > Y.taperStart) pa = Math.max(0, pa - Math.floor((adjusted - Y.taperStart) / 2));
    } else {
      pa = tc.pa; // custom codes already carry HMRC's allowance; K codes are negative
    }
    var allowanceUsed = Math.min(Math.max(pa, 0), taxablePay);
    var taxable = Math.max(0, taxablePay - pa); // K code: pa<0 adds to taxable
    bands.push({ name: 'Personal Allowance', rate: 0, from: 0, to: allowanceUsed, amount: allowanceUsed, tax: 0, isAllowance: true });

    var edges = [], cursor = 0;
    if (opts.region === 'scotland') {
      Y.scotland.forEach(function (b) { edges.push({ name: b.name, rate: b.rate, width: b.width }); });
      // Relief-at-source pension extends the basic-rate side of the ladder (up to the higher band).
      if (ext > 0) edges[2].width += ext;
    } else {
      edges = [
        { name: 'Basic rate', rate: 0.20, width: Y.basicBand + ext },
        { name: 'Higher rate', rate: 0.40, width: (Y.additionalStart - Y.basicBand) + ext },
        { name: 'Additional rate', rate: 0.45, width: Infinity }
      ];
    }
    edges.forEach(function (e) {
      var amt = Math.min(Math.max(0, taxable - cursor), e.width);
      bands.push({ name: e.name, rate: e.rate, from: cursor, to: cursor + (isFinite(e.width) ? e.width : cursor + amt), amount: amt, tax: amt * e.rate });
      tax += amt * e.rate;
      cursor += e.width;
    });
    return { tax: tax, bands: bands, personalAllowance: Math.max(pa, 0) };
  }

  // ---- National Insurance --------------------------------------------------
  function nationalInsurance(niPay, Y) {
    var main = Math.max(0, Math.min(niPay, Y.niUEL) - Y.niPT);
    var upper = Math.max(0, niPay - Y.niUEL);
    return {
      ni: main * Y.niMain + upper * Y.niUpper,
      bands: [
        { name: 'Below Primary Threshold', rate: 0, amount: Math.min(Math.max(niPay, 0), Y.niPT), ni: 0 },
        { name: 'Main rate', rate: Y.niMain, amount: main, ni: main * Y.niMain },
        { name: 'Above Upper Earnings Limit', rate: Y.niUpper, amount: upper, ni: upper * Y.niUpper }
      ]
    };
  }

  // ---- Main calculation ----------------------------------------------------
  function calculate(input) {
    input = input || {};
    var year = YEARS[input.taxYear] ? input.taxYear : DEFAULT_YEAR;
    var Y = YEARS[year];
    var region = input.region === 'scotland' ? 'scotland' : 'uk';
    var salary = Math.max(0, num(input.gross));
    var bonus = Math.max(0, num(input.bonus));
    var sacrifice = Math.max(0, num(input.sacrifice));
    var pensionPct = clamp(num(input.pensionPct), 0, 100);
    var pensionType = input.pensionType === 'sacrifice' || input.pensionType === 'ras' ? input.pensionType : 'netpay';
    var taxCode = parseTaxCode(input.taxCode, year);

    var gross = salary + bonus;
    var afterSacrifice = Math.max(0, gross - sacrifice);
    var pensionBase = afterSacrifice;
    var pension = pensionBase * pensionPct / 100; // what the employee contributes
    var pensionGross = pension, bandExtension = 0;
    if (pensionType === 'ras') { pensionGross = pension / 0.8; bandExtension = pensionGross; }

    var taxablePay, niPay;
    if (pensionType === 'sacrifice') { taxablePay = afterSacrifice - pension; niPay = taxablePay; }
    else if (pensionType === 'netpay') { taxablePay = afterSacrifice - pension; niPay = afterSacrifice; }
    else { taxablePay = afterSacrifice; niPay = afterSacrifice; }

    var adjustedNet = taxablePay - (pensionType === 'ras' ? pensionGross : 0);
    var t = incomeTax(taxablePay, { Y: Y, taxCode: taxCode, region: region, adjustedNet: adjustedNet, bandExtension: bandExtension });
    var n = nationalInsurance(niPay, Y);

    // Student loan repayments are on pay subject to NI.
    var loan = 0, loanPlan = LOAN_NAMES[input.studentLoan] ? input.studentLoan : 'none';
    if (loanPlan !== 'none') loan += Math.max(0, niPay - Y.loans[loanPlan]) * LOAN_RATE;
    var pg = input.postgrad ? Math.max(0, niPay - Y.pgThreshold) * PG_RATE : 0;

    var net = gross - sacrifice - pension - t.tax - n.ni - loan - pg;
    var effectiveTax = gross > 0 ? t.tax / gross : 0;
    var hours = clamp(num(input.hoursPerWeek, 37.5), 1, 100);

    return {
      taxYear: year, yearLabel: Y.label, region: region,
      salary: salary, bonus: bonus, gross: gross, sacrifice: sacrifice,
      pension: pension, pensionType: pensionType, pensionGross: pensionGross,
      tax: t.tax, taxBands: t.bands, personalAllowance: t.personalAllowance,
      ni: n.ni, niBands: n.bands,
      studentLoan: loan, postgrad: pg, loanPlan: loanPlan,
      net: Math.max(0, net),
      totalDeductions: gross - Math.max(0, net),
      effectiveTaxRate: effectiveTax,
      effectiveNiRate: gross > 0 ? n.ni / gross : 0,
      keptRate: gross > 0 ? Math.max(0, net) / gross : 0,
      taxCode: taxCode, hoursPerWeek: hours,
      periods: {
        monthly: net / 12, weekly: net / 52, daily: net / 260, hourly: net / (52 * hours),
        grossMonthly: gross / 12, grossWeekly: gross / 52, grossDaily: gross / 260, grossHourly: gross / (52 * hours)
      },
      input: input
    };
  }

  // Marginal deduction rate on the next £1 (tax + NI + student loan), by finite difference.
  function marginalRate(input, step) {
    step = step || 100;
    var a = calculate(input);
    var b = calculate(Object.assign({}, input, { gross: num(input.gross) + step }));
    return 1 - (b.net - a.net) / step;
  }

  // Gross annual salary from a value entered per period.
  function toAnnual(value, freq, hours) {
    value = num(value);
    if (freq === 'monthly') return value * 12;
    if (freq === 'weekly') return value * 52;
    if (freq === 'daily') return value * 260;
    if (freq === 'hourly') return value * 52 * clamp(num(hours, 37.5), 1, 100);
    return value;
  }
  function fromAnnual(annual, freq, hours) {
    if (freq === 'monthly') return annual / 12;
    if (freq === 'weekly') return annual / 52;
    if (freq === 'daily') return annual / 260;
    if (freq === 'hourly') return annual / (52 * clamp(num(hours, 37.5), 1, 100));
    return annual;
  }

  // ---- Formatting ----------------------------------------------------------
  function gbp(v, dp) {
    dp = dp || 0;
    var r = Math.round(Math.abs(v) * Math.pow(10, dp)) / Math.pow(10, dp);
    var s = r.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return (v < 0 && r !== 0 ? '-£' : '£') + s;
  }
  function pct(v, dp) { return (v * 100).toFixed(dp == null ? 1 : dp) + '%'; }

  return {
    YEARS: YEARS, DEFAULT_YEAR: DEFAULT_YEAR, LOAN_RATE: LOAN_RATE, PG_RATE: PG_RATE, LOAN_NAMES: LOAN_NAMES,
    calculate: calculate, marginalRate: marginalRate, parseTaxCode: parseTaxCode,
    toAnnual: toAnnual, fromAnnual: fromAnnual, gbp: gbp, pct: pct
  };
});
