/*
 * HTML fragments for calculator results. Shared by the static build (Node)
 * and the live calculator (browser) so the pre-rendered page and the
 * interactive page are identical for the same inputs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SalaryRender = factory(root.SalaryEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  var gbp = E.gbp, pct = E.pct;

  var PERIODS = {
    annual: { label: 'year', title: 'Annual', get: function (r) { return r.net; }, dp: 0 },
    monthly: { label: 'month', title: 'Monthly', get: function (r) { return r.periods.monthly; }, dp: 0 },
    weekly: { label: 'week', title: 'Weekly', get: function (r) { return r.periods.weekly; }, dp: 0 },
    daily: { label: 'day', title: 'Daily', get: function (r) { return r.periods.daily; }, dp: 2 },
    hourly: { label: 'hour', title: 'Hourly', get: function (r) { return r.periods.hourly; }, dp: 2 }
  };

  function segPct(part, gross) { return gross > 0 ? Math.min(100, Math.max(0, part / gross * 100)) : 0; }

  function dock(r, headline) {
    var P = PERIODS[headline] || PERIODS.monthly;
    var g = r.gross;
    var other = r.pension + r.studentLoan + r.postgrad + r.sacrifice;
    var pNet = segPct(r.net, g), pTax = segPct(r.tax, g), pNi = segPct(r.ni, g), pOther = segPct(other, g);
    var rows = '';
    rows += '<div class="row"><span>Gross pay</span><strong>' + gbp(r.gross) + '</strong></div>';
    rows += '<div class="row"><span>Income Tax (PAYE)</span><span class="neg">' + gbp(-r.tax) + '</span></div>';
    rows += '<div class="row"><span>National Insurance (Class 1)</span><span class="neg">' + gbp(-r.ni) + '</span></div>';
    if (r.pension > 0) rows += '<div class="row"><span>Pension contribution</span><span>' + gbp(-r.pension) + '</span></div>';
    if (r.sacrifice > 0) rows += '<div class="row"><span>Salary sacrifice</span><span>' + gbp(-r.sacrifice) + '</span></div>';
    if (r.studentLoan > 0) rows += '<div class="row"><span>Student loan (' + E.LOAN_NAMES[r.loanPlan] + ')</span><span>' + gbp(-r.studentLoan) + '</span></div>';
    if (r.postgrad > 0) rows += '<div class="row"><span>Postgraduate loan</span><span>' + gbp(-r.postgrad) + '</span></div>';
    rows += '<div class="row total"><span>Total take-home</span><strong class="pos">' + gbp(r.net) + '</strong></div>';

    return '' +
      '<div class="metric">' +
        '<div class="eyebrow">Estimated take-home pay</div>' +
        '<div class="metric-line"><span class="metric-num">' + gbp(P.get(r), P.dp) + '</span><span class="metric-unit">/ ' + P.label + '</span></div>' +
        (headline === 'annual' ? '' : '<div class="metric-sub"><span>Annual take-home</span><strong>' + gbp(r.net) + ' / year</strong></div>') +
      '</div>' +
      '<div class="dist">' +
        '<div class="dist-head"><span>Where your pay goes</span><strong>' + pct(r.keptRate) + ' kept</strong></div>' +
        '<div class="bar" role="img" aria-label="Take-home ' + pct(r.keptRate) + ', income tax ' + pct(r.effectiveTaxRate) + ', National Insurance ' + pct(r.effectiveNiRate) + '">' +
          '<i class="s-net" style="width:' + pNet.toFixed(2) + '%"></i><i class="s-tax" style="width:' + pTax.toFixed(2) + '%"></i>' +
          '<i class="s-ni" style="width:' + pNi.toFixed(2) + '%"></i><i class="s-other" style="width:' + pOther.toFixed(2) + '%"></i>' +
        '</div>' +
        '<ul class="legend">' +
          '<li><i class="s-net"></i>Take-home ' + pct(r.keptRate) + '</li>' +
          '<li><i class="s-tax"></i>Income Tax ' + pct(r.effectiveTaxRate) + '</li>' +
          '<li><i class="s-ni"></i>NI ' + pct(r.effectiveNiRate) + '</li>' +
          (other > 0 ? '<li><i class="s-other"></i>Other ' + pct(segPct(other, g) / 100) + '</li>' : '') +
        '</ul>' +
      '</div>' +
      '<div class="rows">' + rows + '</div>' +
      '<div class="eyebrow">Equivalent take-home pay</div>' +
      '<div class="equiv">' +
        ['monthly', 'weekly', 'daily', 'hourly'].map(function (k) {
          return '<div><span>' + PERIODS[k].title + '</span><strong>' + gbp(PERIODS[k].get(r), PERIODS[k].dp) + '</strong></div>';
        }).join('') +
      '</div>';
  }

  var ICONS = {
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'
  };
  function icon(n) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[n] + '</svg>'; }

  function cards(r) {
    var loans = r.studentLoan + r.postgrad;
    return '' +
      card('Gross annual pay', 'wallet', 'ic-blue', gbp(r.gross), 'Before any deductions', 'c-ink') +
      card('Income Tax (PAYE)', 'receipt', 'ic-cobalt', gbp(r.tax), 'Effective rate: <b>' + pct(r.effectiveTaxRate) + '</b>', 'c-cobalt') +
      card('National Insurance', 'shield', 'ic-amber', gbp(r.ni), 'Effective rate: <b>' + pct(r.effectiveNiRate) + '</b>', 'c-amber') +
      card('Annual take-home', 'cash', 'ic-green', gbp(r.net), 'You keep <b>' + pct(r.keptRate) + '</b>' + (loans > 0 ? ' after loans' : ''), 'c-green');
  }
  function card(label, ic, icCls, value, sub, valCls) {
    return '<div class="card stat"><div class="stat-top"><span>' + label + '</span><span class="ico ' + icCls + '">' + icon(ic) + '</span></div>' +
      '<div class="stat-val num ' + valCls + '">' + value + '</div><div class="stat-sub">' + sub + '</div></div>';
  }

  function bandTables(r) {
    var t = '<div class="table-wrap"><table class="tbl"><caption>Income Tax by band (' + (r.region === 'scotland' ? 'Scotland' : 'England, Wales &amp; NI') + ', ' + r.yearLabel + ')</caption>' +
      '<thead><tr><th>Band</th><th>Rate</th><th class="r">Income in band</th><th class="r">Tax</th></tr></thead><tbody>';
    r.taxBands.forEach(function (b) {
      if (b.amount <= 0 && !b.isAllowance) return;
      t += '<tr><td>' + b.name + '</td><td>' + (b.rate * 100).toFixed(0).replace(/^(\d+)$/, '$1') + '%</td><td class="r">' + gbp(b.amount) + '</td><td class="r">' + gbp(b.tax) + '</td></tr>';
    });
    t += '<tr class="tot"><td colspan="3">Total Income Tax</td><td class="r">' + gbp(r.tax) + '</td></tr></tbody></table></div>';

    var n = '<div class="table-wrap"><table class="tbl"><caption>Employee National Insurance (Class 1, category A)</caption>' +
      '<thead><tr><th>Band</th><th>Rate</th><th class="r">Pay in band</th><th class="r">NI</th></tr></thead><tbody>';
    r.niBands.forEach(function (b) {
      n += '<tr><td>' + b.name + '</td><td>' + (b.rate * 100).toFixed(0) + '%</td><td class="r">' + gbp(b.amount) + '</td><td class="r">' + gbp(b.ni) + '</td></tr>';
    });
    n += '<tr class="tot"><td colspan="3">Total National Insurance</td><td class="r">' + gbp(r.ni) + '</td></tr></tbody></table></div>';
    return { tax: t, ni: n };
  }

  // Compare the current inputs with the same inputs at a different gross salary.
  function compare(input, delta) {
    var base = E.calculate(input);
    var tInput = Object.assign({}, input, { gross: Math.max(0, base.salary + delta) });
    var t = E.calculate(tInput);
    var dGross = t.gross - base.gross, dNet = t.net - base.net;
    var up = dNet >= 0;
    var sign = function (v) { return (v >= 0 ? '+' : '-') + gbp(Math.abs(v)); };
    var kept = dGross !== 0 ? dNet / dGross : 0;
    var txt;
    if (dGross === 0) txt = 'Pick a pay change above to see how it affects your take-home pay.';
    else txt = 'Moving from <b>' + gbp(base.salary) + '</b> to <b>' + gbp(t.salary) + '</b> changes your take-home by <b>' + sign(dNet) + ' a year</b> (' + sign(dNet / 12) + ' a month). ' +
      (up ? 'You keep <b>' + pct(Math.abs(kept), 0) + '</b> of the extra gross pay; the rest goes in Income Tax and National Insurance'
          : 'Take-home falls by only <b>' + pct(Math.abs(kept), 0) + '</b> of the drop in gross pay; the rest is Income Tax and National Insurance') +
      (base.studentLoan + t.studentLoan + base.postgrad + t.postgrad > 0 ? ', plus student loan' : '') + (up ? '. ' : ' you would no longer pay. ') +
      'Your next pound at the new salary is taxed at a combined <b>' + pct(E.marginalRate(tInput), 0) + '</b>.';
    return '' +
      '<div class="delta-head"><span class="delta-a num">' + sign(dGross) + ' gross</span><span class="delta-b num ' + (up ? 'pos' : 'neg') + '">' + sign(dNet / 12) + ' / month net</span></div>' +
      '<p>' + txt + '</p>';
  }

  return { PERIODS: PERIODS, dock: dock, cards: cards, bandTables: bandTables, compare: compare };
});
