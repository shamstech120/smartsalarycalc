/* Live calculator behaviour. Depends on engine.js and render.js (loaded first). */
(function () {
  'use strict';
  var E = window.SalaryEngine, R = window.SalaryRender;
  var root = document.getElementById('calc');
  if (!root || !E || !R) return;

  var $ = function (id) { return document.getElementById(id); };
  var defaults = {
    freq: root.getAttribute('data-freq') || 'annual',
    salary: parseFloat(root.getAttribute('data-salary')) || 35000
  };
  var freq = defaults.freq;
  var delta = 10000;
  var LABELS = { annual: 'Gross annual salary', monthly: 'Gross monthly salary', weekly: 'Gross weekly pay', hourly: 'Gross hourly rate' };

  // The salary field shows a rounded per-period figure. Remember the exact annual value behind it so
  // switching pay periods back and forth never drifts (50,000 -> 4,167 a month -> 49,998).
  var exact = null;
  function hoursNow() { return parseFloat($('f-hours').value) || 37.5; }
  function grossNow() {
    var v = $('f-salary').value, h = hoursNow();
    if (exact && exact.shown === v && exact.hours === h && exact.freq === freq) return exact.annual;
    return E.toAnnual(v, freq, h);
  }

  function read() {
    var hours = hoursNow();
    return {
      gross: grossNow(),
      taxYear: $('f-year').value,
      taxCode: $('f-code').value,
      pensionPct: $('f-pct').value,
      pensionType: $('f-ptype').value,
      studentLoan: $('f-loan').value,
      postgrad: $('f-pg').checked,
      region: $('f-region').value === 'scotland' ? 'scotland' : 'uk',
      bonus: $('f-bonus').value,
      sacrifice: $('f-sac').value,
      hoursPerWeek: hours
    };
  }

  function update() {
    var input = read();
    var r = E.calculate(input);
    $('o-dock').innerHTML = R.dock(r, freq === 'annual' ? 'monthly' : freq);
    $('o-cards').innerHTML = R.cards(r);
    var b = R.bandTables(r);
    $('o-bands-tax').innerHTML = b.tax;
    $('o-bands-ni').innerHTML = b.ni;
    $('o-compare').innerHTML = R.compare(input, delta);
    var mb = $('mbar-val');
    if (mb) mb.textContent = E.gbp(r.periods.monthly) + ' / month';
    var hint = $('code-hint');
    if (hint) {
      var bad = !r.taxCode.ok;
      hint.hidden = !bad;
      $('f-code').setAttribute('aria-invalid', bad ? 'true' : 'false');
    }
    var yearLbl = document.querySelectorAll('[data-year-label]');
    for (var i = 0; i < yearLbl.length; i++) yearLbl[i].textContent = r.yearLabel;
  }

  function setFreq(next) {
    var hours = hoursNow();
    var annual = grossNow();
    freq = next;
    var v = E.fromAnnual(annual, freq, hours);
    $('f-salary').value = freq === 'hourly' ? v.toFixed(2) : Math.round(v);
    exact = { annual: annual, shown: $('f-salary').value, hours: hours, freq: freq };
    applyFreqUI();
    update();
  }

  function applyFreqUI() {
    $('f-salary').step = freq === 'hourly' ? '0.25' : freq === 'annual' ? '500' : '50';
    $('lbl-salary').textContent = LABELS[freq];
    $('row-hours').hidden = freq !== 'hourly';
    var pills = root.querySelectorAll('.pills [data-freq]');
    for (var i = 0; i < pills.length; i++) {
      var on = pills[i].getAttribute('data-freq') === freq;
      pills[i].classList.toggle('on', on);
      pills[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-freq], [data-delta], #btn-reset, #btn-calc');
    if (!t) return;
    if (t.hasAttribute('data-freq')) setFreq(t.getAttribute('data-freq'));
    else if (t.hasAttribute('data-delta')) {
      delta = parseFloat(t.getAttribute('data-delta'));
      var ps = document.querySelectorAll('[data-delta]');
      for (var i = 0; i < ps.length; i++) {
        var on = ps[i] === t;
        ps[i].classList.toggle('on', on);
        ps[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      update();
    } else if (t.id === 'btn-reset') {
      root.querySelector('form').reset(); // restores the pre-rendered defaults for this page
      freq = defaults.freq;
      exact = null;
      applyFreqUI();
      update();
    } else if (t.id === 'btn-calc') {
      update();
      if (window.matchMedia('(max-width: 1023px)').matches) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  root.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); update(); });
  root.querySelector('form').addEventListener('input', update);
  root.querySelector('form').addEventListener('change', update);

  // Deep link: ?salary=45000 (an annual figure), shown in the page's own pay period.
  try {
    var q = parseFloat(new URLSearchParams(location.search).get('salary'));
    if (isFinite(q) && q >= 0) {
      var v = E.fromAnnual(q, freq, parseFloat($('f-hours').value) || 37.5);
      $('f-salary').value = freq === 'hourly' ? v.toFixed(2) : Math.round(v);
    }
  } catch (err) { /* older browsers: ignore */ }

  applyFreqUI();
  update();
})();
