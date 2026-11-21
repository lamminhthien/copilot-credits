/*
 * Pricing-math tests. Runs in a browser-less JS engine with
 * data/models.js and assets/calc.js already loaded (see run.js / run-tests.py).
 */
(function () {
  'use strict';

  var Calc = globalThis.CopilotCalc;
  var DATA = globalThis.COPILOT_DATA;
  var results = [];
  var failures = 0;

  function test(name, fn) {
    try {
      fn();
      results.push({ name: name, ok: true });
    } catch (error) {
      failures += 1;
      results.push({ name: name, ok: false, error: String(error && error.message ? error.message : error) });
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'expected a truthy value');
  }

  function near(actual, expected, epsilon, label) {
    var diff = Math.abs(actual - expected);
    assert(diff <= (epsilon || 1e-9),
      (label || 'value') + ': expected ' + expected + ', got ' + actual);
  }

  function model(id) {
    var found = DATA.models.filter(function (m) { return m.id === id; })[0];
    assert(found, 'missing model ' + id);
    return found;
  }

  function tokens(input, cached, cacheWrite, output) {
    return { input: input, cached: cached, cacheWrite: cacheWrite, output: output };
  }

  test('default-profile cost matches hand math', function () {
    var cost = Calc.computeCost(model('claude-sonnet-5'), tokens(4000, 20000, 0, 800));
    near(cost.usd, 0.02, 1e-9, 'USD');
    near(cost.credits, 2, 1e-9, 'credits');
    assert(cost.tier.label === 'Default', 'expected default tier');
  });

  test('credits convert at 100 per dollar', function () {
    var cost = Calc.computeCost(model('claude-sonnet-5'), tokens(0, 0, 0, 100000));
    near(cost.usd, 1, 1e-9, 'USD');
    near(cost.credits, 100, 1e-9, 'credits');
  });

  test('long-context tier kicks in above the threshold', function () {
    var luna = model('gpt-5.6-luna');
    var atLimit = Calc.computeCost(luna, tokens(200000, 0, 0, 0));
    var overLimit = Calc.computeCost(luna, tokens(200001, 0, 0, 0));
    assert(atLimit.tier.label === 'Default', '200K should stay default');
    assert(overLimit.tier.label === 'Long context', '200,001 should be long context');
    near(atLimit.usd, 0.04, 1e-9, 'default USD');
    near(overLimit.usd, 0.0800004, 1e-9, 'long-context USD');
  });

  test('cached tokens count toward the tier threshold', function () {
    var cost = Calc.computeCost(model('claude-haiku-5.5'), tokens(50000, 60000, 0, 0));
    assert(cost.tier.label === 'Long context', '100K+ prompt should use long context');
  });

  test('cache writes are billed when the model supports them', function () {
    var cost = Calc.computeCost(model('claude-sonnet-5'), tokens(0, 0, 1000000, 0));
    near(cost.usd, 2.5, 1e-9, 'USD');
    near(cost.credits, 250, 1e-9, 'credits');
    assert(cost.ignoredCacheWrite === false, 'cache write should be billed');
  });

  test('cache writes are ignored for models without a cache-write rate', function () {
    var cost = Calc.computeCost(model('gpt-5.3-codex'), tokens(0, 0, 1000000, 0));
    near(cost.usd, 0, 1e-9, 'USD');
    assert(cost.ignoredCacheWrite === true, 'should flag ignored cache write');
  });

  test('all four token buckets are priced independently', function () {
    var cost = Calc.computeCost(model('claude-sonnet-5'), tokens(1000000, 1000000, 1000000, 1000000));
    near(cost.usd, 2 + 0.2 + 2.5 + 10, 1e-9, 'USD');
  });

  test('individual allowance ignores seats', function () {
    var pro = DATA.plans.filter(function (p) { return p.id === 'pro'; })[0];
    assert(Calc.allowanceFor(pro, 99) === 1500, 'Pro should stay at 1,500');
  });

  test('pooled allowance multiplies by seats', function () {
    var business = DATA.plans.filter(function (p) { return p.id === 'business'; })[0];
    assert(Calc.allowanceFor(business, 5) === 9500, 'Business pool should be 1,900 x 5');
    assert(Calc.allowanceFor(business, 0) === 1900, 'seats should clamp to at least 1');
  });

  test('unpublished allowances return null', function () {
    var free = DATA.plans.filter(function (p) { return p.id === 'free'; })[0];
    assert(Calc.allowanceFor(free, 1) === null, 'Free allowance should be null');
  });

  test('token shorthand parsing', function () {
    assert(Calc.parseTokens('1.5m') === 1500000, '1.5m');
    assert(Calc.parseTokens('200k') === 200000, '200k');
    assert(Calc.parseTokens('1,234') === 1234, 'commas');
    assert(Calc.parseTokens('2.5 b') === 2500000000, 'spaces + b');
    assert(Calc.parseTokens('') === 0, 'empty');
    assert(Calc.parseTokens('0') === 0, 'zero');
    assert(isNaN(Calc.parseTokens('abc')), 'letters should be invalid');
    assert(isNaN(Calc.parseTokens('-5')), 'negative should be invalid');
  });

  test('days left in the UTC month', function () {
    assert(Calc.daysLeftInMonth(new Date(Date.UTC(2026, 10, 21))) === 10, 'Nov 21 -> 10 days');
    assert(Calc.daysLeftInMonth(new Date(Date.UTC(2026, 11, 1))) === 31, 'Dec 1 -> 31 days');
    assert(Calc.daysLeftInMonth(new Date(Date.UTC(2026, 11, 31))) === 1, 'Dec 31 -> 1 day');
  });

  test('model data is internally consistent', function () {
    var ids = {};
    DATA.models.forEach(function (m) {
      assert(!ids[m.id], 'duplicate id ' + m.id);
      ids[m.id] = true;
      assert(m.tiers.length > 0, m.id + ' has no tiers');
      assert(m.tiers[m.tiers.length - 1].maxInput === null, m.id + ' last tier must be open-ended');
      m.tiers.forEach(function (tier) {
        ['input', 'cached', 'output'].forEach(function (key) {
          assert(typeof tier[key] === 'number' && tier[key] >= 0, m.id + ' bad ' + key);
        });
        assert(tier.cacheWrite === null || (typeof tier.cacheWrite === 'number' && tier.cacheWrite >= 0),
          m.id + ' bad cacheWrite');
      });
    });
    assert(DATA.models.length === 35, 'expected 35 models, found ' + DATA.models.length);
  });

  test('every model prices a standard profile without NaN', function () {
    DATA.models.forEach(function (m) {
      var cost = Calc.computeCost(m, tokens(12000, 48000, 10000, 2500));
      assert(isFinite(cost.usd) && cost.usd >= 0, m.id + ' produced an invalid cost');
      assert(isFinite(cost.credits) && cost.credits >= 0, m.id + ' produced invalid credits');
    });
  });

  test('plan totals match GitHub documentation', function () {
    var expected = { pro: 1500, proplus: 7000, max: 20000, business: 1900, enterprise: 3900 };
    DATA.plans.forEach(function (p) {
      if (expected[p.id] !== undefined) assert(p.total === expected[p.id], p.id + ' total');
      if (p.total !== null && p.base !== null) {
        assert(p.base + (p.flex || 0) === p.total, p.id + ' base + flex');
      }
    });
  });

  test('legacy multipliers are limited to the documented models', function () {
    var expected = {
      'claude-haiku-4.5': 0.33,
      'claude-opus-4.8': 27,
      'claude-sonnet-4.6': 9,
      'gpt-5.3-codex': 6,
      'mai-code-1.1-flash': 0.25,
      'mai-code-2': 1,
      'mai-code-2-flash': 0.33
    };
    var found = {};
    DATA.models.forEach(function (m) {
      if (typeof m.legacyMultiplier === 'number') found[m.id] = m.legacyMultiplier;
    });
    assert(Object.keys(found).length === Object.keys(expected).length, 'wrong multiplier count');
    Object.keys(expected).forEach(function (id) {
      assert(found[id] === expected[id], id + ' multiplier');
    });
    assert(DATA.legacy.codeReviewMultiplier === 13, 'code review multiplier');
  });

  globalThis.__testReport = {
    failures: failures,
    total: results.length,
    results: results
  };

  if (typeof console !== 'undefined' && console.log) {
    results.forEach(function (r) {
      console.log((r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : ' — ' + r.error));
    });
    console.log(failures ? failures + ' test(s) failed' : 'All ' + results.length + ' tests passed');
  }
})();
