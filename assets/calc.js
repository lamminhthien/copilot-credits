/*
 * Pure pricing math for the Copilot Credits estimator.
 * No DOM access, so it can run in the browser, Node, or a test harness.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CopilotCalc = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_CREDIT_USD = 0.01;

  function promptTokens(tokens) {
    return tokens.input + tokens.cached + tokens.cacheWrite;
  }

  /**
   * GitHub applies the long-context tier to the whole request once prompt
   * tokens pass the threshold. Tiers are ordered from smallest to largest,
   * with `maxInput: null` on the final tier.
   */
  function pickTier(model, tokens) {
    var total = promptTokens(tokens);
    for (var i = 0; i < model.tiers.length; i++) {
      var tier = model.tiers[i];
      if (tier.maxInput === null || total <= tier.maxInput) return tier;
    }
    return model.tiers[model.tiers.length - 1];
  }

  function computeCost(model, tokens, creditUsd) {
    var rate = creditUsd || DEFAULT_CREDIT_USD;
    var tier = pickTier(model, tokens);
    var parts = [];

    function add(label, count, price) {
      if (price === null || price === undefined) return;
      parts.push({
        label: label,
        tokens: count,
        rate: price,
        usd: (count / 1000000) * price
      });
    }

    add('Input', tokens.input, tier.input);
    add('Cached input', tokens.cached, tier.cached);
    add('Cache write', tokens.cacheWrite, tier.cacheWrite);
    add('Output', tokens.output, tier.output);

    var usd = 0;
    for (var i = 0; i < parts.length; i++) usd += parts[i].usd;

    return {
      model: model,
      tier: tier,
      parts: parts,
      usd: usd,
      credits: usd / rate,
      ignoredCacheWrite: tier.cacheWrite === null && tokens.cacheWrite > 0
    };
  }

  function allowanceFor(plan, seats) {
    if (plan.total === null || plan.total === undefined) return null;
    var count = plan.pooled ? Math.max(1, seats || 1) : 1;
    return plan.total * count;
  }

  function parseTokens(value) {
    if (typeof value === 'number') return value >= 0 ? Math.round(value) : NaN;
    var text = String(value).trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '');
    if (!text) return 0;
    var match = text.match(/^([0-9]*\.?[0-9]+)([kmb])?$/);
    if (!match) return NaN;
    var n = parseFloat(match[1]);
    if (!isFinite(n)) return NaN;
    var mult = match[2] === 'k' ? 1e3 : match[2] === 'm' ? 1e6 : match[2] === 'b' ? 1e9 : 1;
    return Math.max(0, Math.round(n * mult));
  }

  function daysLeftInMonth(now) {
    var date = now || new Date();
    var last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    return last - date.getUTCDate() + 1;
  }

  return {
    DEFAULT_CREDIT_USD: DEFAULT_CREDIT_USD,
    promptTokens: promptTokens,
    pickTier: pickTier,
    computeCost: computeCost,
    allowanceFor: allowanceFor,
    parseTokens: parseTokens,
    daysLeftInMonth: daysLeftInMonth
  };
}));
