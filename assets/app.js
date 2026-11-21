(function () {
  'use strict';

  var DATA = window.COPILOT_DATA;
  var Calc = window.CopilotCalc;
  var CREDIT_USD = DATA.meta.creditUsd || Calc.DEFAULT_CREDIT_USD;
  var STORAGE_KEY = 'copilot-credits:v1';

  var state = {
    tab: 'calculator',
    theme: 'dark',
    modelId: 'claude-sonnet-5',
    input: 4000,
    cached: 20000,
    cacheWrite: 0,
    output: 800,
    planId: 'pro',
    seats: 1,
    used: 0,
    legacyModelId: 'claude-sonnet-4.6',
    legacyUses: 10,
    legacyAllowance: 300,
    provider: 'all',
    category: 'all',
    sort: 'credits-asc',
    search: ''
  };

  var MODEL_BY_ID = {};
  DATA.models.forEach(function (m) { MODEL_BY_ID[m.id] = m; });
  var PLAN_BY_ID = {};
  DATA.plans.forEach(function (p) { PLAN_BY_ID[p.id] = p; });

  /* ------------------------------------------------------------- utilities */

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtInt(n) {
    if (!isFinite(n)) return '—';
    return Math.round(n).toLocaleString('en-US');
  }

  function fmtCredits(n) {
    if (!isFinite(n)) return '—';
    if (n === 0) return '0';
    if (n < 0.01) return n.toFixed(4);
    if (n < 1) return n.toFixed(3);
    if (n < 100) return n.toFixed(2);
    if (n < 10000) return Math.round(n).toLocaleString('en-US');
    return (n / 1000).toFixed(1) + 'K';
  }

  function fmtUsd(n) {
    if (!isFinite(n)) return '—';
    if (n === 0) return '$0.00';
    var abs = Math.abs(n);
    if (abs < 0.01) return '$' + n.toFixed(4);
    return '$' + n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fmtRate(n) {
    if (n === null || n === undefined) return '—';
    return '$' + n.toFixed(n < 0.1 ? 3 : 2);
  }

  function fmtTokens(n) {
    if (!isFinite(n)) return '—';
    if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return fmtInt(n);
  }

  function parseTokens(value) {
    return Calc.parseTokens(value);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function daysLeftInMonth() {
    return Calc.daysLeftInMonth(new Date());
  }

  /* ----------------------------------------------------------- model math */

  function activeModel() {
    return MODEL_BY_ID[state.modelId] || DATA.models[0];
  }

  function activePlan() {
    return PLAN_BY_ID[state.planId] || DATA.plans[1];
  }

  function promptTokens(tokens) {
    return Calc.promptTokens(tokens);
  }

  function pickTier(model, tokens) {
    return Calc.pickTier(model, tokens);
  }

  function computeCost(model, tokens) {
    return Calc.computeCost(model, tokens, CREDIT_USD);
  }

  function allowanceFor(plan) {
    return Calc.allowanceFor(plan, state.seats);
  }

  /* ------------------------------------------------------------- rendering */

  function renderModelMeta() {
    var model = activeModel();
    var bits = [model.provider, model.category, model.status];
    if (model.tiers.length > 1) bits.push('Default + long context');
    if (model.annualOnly) bits.push('Annual plans only');

    var html = '<span class="meta-line">' + esc(bits.join(' · ')) + '</span>';
    if (model.note) html += '<span class="meta-note">' + esc(model.note) + '</span>';
    $('modelMeta').innerHTML = html;

    var tier = pickTier(model, currentTokens());
    $('cacheWriteHint').textContent = tier.cacheWrite === null
      ? 'This model does not bill cache writes.'
      : 'Billed at ' + fmtRate(tier.cacheWrite) + ' per 1M tokens.';
  }

  function currentTokens() {
    return {
      input: state.input,
      cached: state.cached,
      cacheWrite: state.cacheWrite,
      output: state.output
    };
  }

  function renderCalculator() {
    var model = activeModel();
    var cost = computeCost(model, currentTokens());
    var plan = activePlan();
    var allowance = allowanceFor(plan);

    $('tierBadge').textContent = cost.tier.label +
      (cost.tier.maxInput ? ' · ≤ ' + fmtTokens(cost.tier.maxInput) : '');

    $('resultCredits').textContent = fmtCredits(cost.credits);
    $('resultUsd').textContent = fmtUsd(cost.usd);

    var rows = cost.parts.map(function (part) {
      return '<div class="bd-row">' +
        '<span class="bd-label">' + esc(part.label) +
        '<span class="bd-tokens">' + fmtInt(part.tokens) + ' tok × ' + fmtRate(part.rate) + '/M</span></span>' +
        '<span class="bd-usd">' + fmtUsd(part.usd) + '</span>' +
        '</div>';
    });
    if (cost.ignoredCacheWrite) {
      rows.push('<div class="bd-row is-muted">' +
        '<span class="bd-label">Cache write<span class="bd-tokens">' + fmtInt(state.cacheWrite) +
        ' tok · not billed by this model</span></span>' +
        '<span class="bd-usd">$0.00</span></div>');
    }
    $('breakdown').innerHTML = rows.join('') ||
      '<div class="bd-row is-muted"><span class="bd-label">Enter some tokens to see a breakdown.</span></div>';

    var bar = $('bar');
    var fill = $('barFill');
    if (allowance === null) {
      $('allowanceText').textContent = 'Not published';
      $('fitsText').textContent = 'Allowance unknown for this plan';
      $('pctText').textContent = '—';
      fill.style.width = '0%';
      fill.classList.remove('is-over');
      bar.setAttribute('aria-valuenow', '0');
      $('calcNote').textContent = 'GitHub does not publish this plan’s AI-credit allowance. The per-request estimate is still accurate.';
    } else {
      var pct = allowance > 0 ? (cost.credits / allowance) * 100 : 0;
      var fits = cost.credits > 0 ? Math.floor(allowance / cost.credits) : Infinity;
      var shown = clamp(pct, 0, 100);

      $('allowanceText').textContent = fmtInt(allowance) + ' credits';
      fill.style.width = shown + '%';
      fill.classList.toggle('is-over', pct > 100);
      bar.setAttribute('aria-valuenow', String(Math.round(shown)));

      if (pct > 100) {
        var over = cost.credits - allowance;
        $('fitsText').textContent = 'Exceeds the allowance by ' + fmtCredits(over) + ' credits';
        $('pctText').textContent = fmtUsd(over * CREDIT_USD) + ' extra';
      } else {
        $('fitsText').textContent = fits === Infinity
          ? 'Free at these token counts'
          : 'Fits ' + fmtInt(fits) + '× in your allowance';
        $('pctText').textContent = pct < 0.01 ? '<0.01%' : pct.toFixed(pct < 1 ? 2 : 1) + '%';
      }

      var note = 'Priced with ' + model.name + ' ' + cost.tier.label.toLowerCase() + ' rates';
      if (plan.pooled) note += ' across ' + fmtInt(state.seats) + ' seat' + (state.seats === 1 ? '' : 's');
      note += '.';
      if (cost.ignoredCacheWrite) note += ' Cache writes are not billed for this model.';
      $('calcNote').textContent = note;
    }
  }

  function renderCompare() {
    var tokens = currentTokens();
    var plan = activePlan();
    var allowance = allowanceFor(plan);
    var cheapest = null;
    var rows = [];

    DATA.models.forEach(function (model) {
      var cost = computeCost(model, tokens);
      var matchesSearch = !state.search ||
        (model.name + ' ' + model.provider).toLowerCase().indexOf(state.search.toLowerCase()) !== -1;
      var matchesProvider = state.provider === 'all' || model.provider === state.provider;
      var matchesCategory = state.category === 'all' || model.category === state.category;
      if (!matchesSearch || !matchesProvider || !matchesCategory) return;

      rows.push({ model: model, cost: cost });
      if (cheapest === null || cost.credits < cheapest.credits) cheapest = cost;
    });

    rows.sort(function (a, b) {
      switch (state.sort) {
        case 'credits-desc': return b.cost.credits - a.cost.credits || a.model.name.localeCompare(b.model.name);
        case 'name': return a.model.name.localeCompare(b.model.name);
        case 'input-asc': return a.cost.tier.input - b.cost.tier.input || a.cost.credits - b.cost.credits;
        case 'output-asc': return a.cost.tier.output - b.cost.tier.output || a.cost.credits - b.cost.credits;
        default: return a.cost.credits - b.cost.credits || a.model.name.localeCompare(b.model.name);
      }
    });

    $('compareProfile').innerHTML = '<strong>Profile:</strong> ' +
      fmtInt(tokens.input) + ' input · ' +
      fmtInt(tokens.cached) + ' cached · ' +
      fmtInt(tokens.cacheWrite) + ' cache write · ' +
      fmtInt(tokens.output) + ' output. ' +
      (allowance === null
        ? esc(plan.name) + ' allowance is not published.'
        : 'Compared against ' + esc(plan.name) + ' (' + fmtInt(allowance) + ' credits).');

    var body = $('compareBody');
    if (!rows.length) {
      body.innerHTML = '';
      $('compareEmpty').hidden = false;
      return;
    }
    $('compareEmpty').hidden = true;

    body.innerHTML = rows.map(function (row) {
      var model = row.model;
      var cost = row.cost;
      var fits = allowance === null || cost.credits === 0
        ? (allowance === null ? '—' : '∞')
        : fmtInt(Math.floor(allowance / cost.credits));
      var isCheapest = cheapest && cost.credits === cheapest.credits;
      var badges = '';
      if (isCheapest && rows.length > 1) badges += '<span class="mini-badge is-best">cheapest</span>';
      if (model.annualOnly) badges += '<span class="mini-badge is-warn">annual only</span>';
      if (model.promoUntil) badges += '<span class="mini-badge">promo</span>';
      if (model.status === 'Legacy') badges += '<span class="mini-badge is-warn">legacy</span>';
      if (model.status === 'Preview') badges += '<span class="mini-badge">preview</span>';

      return '<tr data-model-id="' + esc(model.id) + '" tabindex="0" title="Load in calculator"' +
        (model.id === state.modelId ? ' class="is-selected"' : '') + '>' +
        '<td><span class="model-name">' + esc(model.name) + '</span>' +
        '<span class="model-sub">' + esc(model.provider) + ' · ' + esc(model.category) + ' ' + badges + '</span></td>' +
        '<td><span class="cat cat-' + model.category.toLowerCase() + '">' + esc(model.category) + '</span></td>' +
        '<td class="num">' + fmtRate(cost.tier.input) + '</td>' +
        '<td class="num">' + fmtRate(cost.tier.cached) + '</td>' +
        '<td class="num">' + fmtRate(cost.tier.cacheWrite) + '</td>' +
        '<td class="num">' + fmtRate(cost.tier.output) + '</td>' +
        '<td class="num strong">' + fmtCredits(cost.credits) + '</td>' +
        '<td class="num">' + fmtUsd(cost.usd) + '</td>' +
        '<td class="num">' + fits + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderPlanCards() {
    var grid = $('planGrid');
    grid.innerHTML = DATA.plans.map(function (plan) {
      var credits = plan.total === null
        ? 'Allowance not published'
        : fmtInt(plan.total) + (plan.pooled ? ' credits / seat' : ' credits');
      var price = plan.price === 0 ? 'Free' : '$' + plan.price + '<span class="per">/mo' + (plan.pooled ? ' /seat' : '') + '</span>';
      return '<button class="plan-card' + (plan.id === state.planId ? ' is-selected' : '') +
        '" type="button" role="radio" aria-checked="' + (plan.id === state.planId) + '" data-plan="' + esc(plan.id) + '">' +
        '<span class="plan-name">' + esc(plan.name) + '</span>' +
        '<span class="plan-price">' + price + '</span>' +
        '<span class="plan-credits">' + credits + '</span>' +
        '<span class="plan-note">' + esc(plan.note) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderPlans() {
    renderPlanCards();
    var plan = activePlan();
    var allowance = allowanceFor(plan);
    var used = Math.max(0, state.used);
    var days = daysLeftInMonth();

    $('summaryPlanName').textContent = plan.name;
    $('planNote').textContent = plan.note;
    $('usageSeatsField').hidden = !plan.pooled;
    $('usageSeats').value = state.seats;

    var bar = $('summaryBar');
    var fill = $('summaryBarFill');

    if (allowance === null) {
      $('summaryRemaining').textContent = '—';
      $('summaryRemainingUsd').textContent = 'Allowance not published';
      fill.style.width = '0%';
      fill.classList.remove('is-over');
      bar.setAttribute('aria-valuenow', '0');
      $('summaryUsed').textContent = fmtInt(used) + ' credits used';
      $('summaryPct').textContent = '—';
      $('statDays').textContent = String(days);
      $('statDaily').textContent = '—';
      $('statRequests').textContent = '—';
      $('statOverage').textContent = '—';
      $('summaryNote').textContent = 'GitHub publishes an allowance for this plan but not the amount. Check your billing dashboard for the exact figure.';
      return;
    }

    var remaining = allowance - used;
    var pct = allowance > 0 ? (used / allowance) * 100 : 0;
    var overage = Math.max(0, used - allowance);
    var cost = computeCost(activeModel(), currentTokens());
    var requestsLeft = remaining > 0
      ? (cost.credits > 0 ? Math.floor(remaining / cost.credits) : Infinity)
      : 0;

    $('summaryRemaining').textContent = remaining > 0 ? fmtCredits(remaining) : '0';
    $('summaryRemainingUsd').textContent = remaining > 0
      ? fmtUsd(remaining * CREDIT_USD) + ' of included value left'
      : 'Allowance exhausted';

    fill.style.width = clamp(pct, 0, 100) + '%';
    fill.classList.toggle('is-over', pct > 100);
    bar.setAttribute('aria-valuenow', String(Math.round(clamp(pct, 0, 100))));

    $('summaryUsed').textContent = fmtInt(used) + ' of ' + fmtInt(allowance) + ' credits used';
    $('summaryPct').textContent = pct.toFixed(pct < 1 ? 2 : 1) + '%';

    $('statDays').textContent = String(days);
    $('statDaily').textContent = remaining > 0 ? fmtCredits(remaining / days) + ' cr' : '0';
    $('statRequests').textContent = requestsLeft === Infinity
      ? '∞'
      : fmtInt(requestsLeft) + '×';
    $('statOverage').textContent = overage > 0 ? fmtUsd(overage * CREDIT_USD) : '$0.00';

    if (overage > 0) {
      $('summaryNote').textContent = 'You are ' + fmtInt(overage) + ' credits over — about ' +
        fmtUsd(overage * CREDIT_USD) + ' in additional usage at $0.01 per credit.';
    } else {
      $('summaryNote').textContent = 'That leaves about ' + fmtCredits(remaining / days) +
        ' credits per day until the cycle resets, or roughly ' +
        (requestsLeft === Infinity ? 'unlimited' : fmtInt(requestsLeft) + ' more ' + activeModel().name + ' requests at this profile.');
    }
  }

  function legacyModels() {
    return DATA.models.filter(function (m) { return typeof m.legacyMultiplier === 'number'; });
  }

  function renderLegacy() {
    var model = MODEL_BY_ID[state.legacyModelId] || legacyModels()[0];
    var multiplier = model.legacyMultiplier;
    var uses = Math.max(0, state.legacyUses || 0);
    var allowance = Math.max(0, state.legacyAllowance || 0);
    var used = uses * multiplier;
    var remaining = allowance - used;
    var pct = allowance > 0 ? (used / allowance) * 100 : 0;
    var fits = multiplier > 0 ? Math.floor(allowance / multiplier) : 0;

    $('legacyMultiplierBadge').textContent = multiplier + '×';
    $('legacyUsed').textContent = fmtCredits(used);
    $('legacyRemaining').textContent = remaining >= 0
      ? fmtInt(remaining) + ' of ' + fmtInt(allowance) + ' requests left'
      : fmtInt(Math.abs(remaining)) + ' requests over allowance';
    $('legacyBarFill').style.width = clamp(pct, 0, 100) + '%';
    $('legacyBarFill').classList.toggle('is-over', pct > 100);
    $('legacyBar').setAttribute('aria-valuenow', String(Math.round(clamp(pct, 0, 100))));
    $('legacyFits').textContent = fmtInt(fits) + ' interactions fit in ' + fmtInt(allowance) + ' requests';
    $('legacyPct').textContent = pct.toFixed(pct < 1 ? 2 : 0) + '% used';
    $('legacyHint').textContent = 'Each ' + model.name + ' interaction costs ' + multiplier +
      ' premium request' + (multiplier === 1 ? '' : 's') + '.';
    $('legacyNote').textContent = multiplier >= 10
      ? 'Frontier models burn through a legacy allowance fast. At this multiplier, ' + fmtInt(fits) + ' interactions exhaust the month.'
      : 'Auto model selection applies a 10% discount on legacy plans.';

    $('legacyAllowanceLabel').textContent = fmtInt(allowance);

    var rows = legacyModels().map(function (m) {
      return '<tr' + (m.id === model.id ? ' class="is-selected"' : '') + '>' +
        '<td><span class="model-name">' + esc(m.name) + '</span>' +
        '<span class="model-sub">' + esc(m.provider) + '</span></td>' +
        '<td class="num strong">' + m.legacyMultiplier + '×</td>' +
        '<td class="num">' + (m.legacyMultiplier > 0 ? fmtInt(Math.floor(allowance / m.legacyMultiplier)) : '—') + '</td>' +
        '</tr>';
    });
    rows.push('<tr class="is-feature">' +
      '<td><span class="model-name">Copilot code review</span><span class="model-sub">Per review or IDE review</span></td>' +
      '<td class="num strong">' + DATA.legacy.codeReviewMultiplier + '×</td>' +
      '<td class="num">' + fmtInt(Math.floor(allowance / DATA.legacy.codeReviewMultiplier)) + '</td>' +
      '</tr>');
    $('legacyBody').innerHTML = rows.join('');
  }

  /* ------------------------------------------------------------ ui plumbing */

  function fillModelSelect() {
    var select = $('modelSelect');
    var providers = [];
    DATA.models.forEach(function (m) {
      if (providers.indexOf(m.provider) === -1) providers.push(m.provider);
    });
    select.innerHTML = providers.map(function (provider) {
      var options = DATA.models.filter(function (m) { return m.provider === provider; })
        .map(function (m) {
          return '<option value="' + esc(m.id) + '">' + esc(m.name) +
            (m.annualOnly ? ' (annual only)' : '') + '</option>';
        }).join('');
      return '<optgroup label="' + esc(provider) + '">' + options + '</optgroup>';
    }).join('');
    select.value = state.modelId;
  }

  function fillPlanSelect() {
    var select = $('planSelect');
    select.innerHTML = DATA.plans.map(function (p) {
      var credits = p.total === null ? 'allowance n/a' : fmtInt(p.total) + ' credits';
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' — ' + credits + '</option>';
    }).join('');
    select.value = state.planId;
  }

  function fillProviderFilter() {
    var select = $('providerFilter');
    var providers = [];
    DATA.models.forEach(function (m) {
      if (providers.indexOf(m.provider) === -1) providers.push(m.provider);
    });
    select.innerHTML = '<option value="all">All providers</option>' + providers.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + '</option>';
    }).join('');
    select.value = state.provider;
  }

  function fillLegacySelect() {
    var select = $('legacyModel');
    select.innerHTML = legacyModels().map(function (m) {
      return '<option value="' + esc(m.id) + '">' + esc(m.name) + ' — ' + m.legacyMultiplier + '×</option>';
    }).join('');
    select.value = state.legacyModelId;
  }

  function syncInputs() {
    $('modelSelect').value = state.modelId;
    $('inputTokens').value = String(state.input);
    $('cachedTokens').value = String(state.cached);
    $('cacheWriteTokens').value = String(state.cacheWrite);
    $('outputTokens').value = String(state.output);
    $('planSelect').value = state.planId;
    $('seatsInput').value = String(state.seats);
    $('usedCredits').value = String(state.used);
    $('usageSeats').value = String(state.seats);
    $('legacyUses').value = String(state.legacyUses);
    $('legacyAllowance').value = String(state.legacyAllowance);
    $('legacyModel').value = state.legacyModelId;
    $('compareSearch').value = state.search || '';
    $('providerFilter').value = state.provider || 'all';
    $('categoryFilter').value = state.category || 'all';
    $('sortSelect').value = state.sort || 'credits-asc';
    $('seatsField').hidden = !activePlan().pooled;
    $('usageSeatsField').hidden = !activePlan().pooled;
    $('planHint').textContent = activePlan().note;
  }

  function bindTokenInput(id, key) {
    var el = $(id);
    el.addEventListener('input', function () {
      var parsed = parseTokens(el.value);
      if (isNaN(parsed)) {
        el.classList.add('is-invalid');
        el.setAttribute('aria-invalid', 'true');
        return;
      }
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      state[key] = parsed;
      save();
      renderModelMeta();
      renderCalculator();
      renderCompare();
    });
    el.addEventListener('blur', function () {
      if (!isNaN(parseTokens(el.value))) el.value = String(state[key]);
    });
  }

  function selectModel(id) {
    if (!MODEL_BY_ID[id]) return;
    state.modelId = id;
    save();
    syncInputs();
    setTab('calculator');
    renderModelMeta();
    renderCalculator();
    renderCompare();
    renderPlans();
  }

  function setTab(tab, skipHash) {
    var valid = ['calculator', 'compare', 'plans', 'legacy'];
    if (valid.indexOf(tab) === -1) tab = 'calculator';
    state.tab = tab;

    document.querySelectorAll('.tab').forEach(function (button) {
      var active = button.getAttribute('data-tab') === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    valid.forEach(function (name) {
      var panel = $('panel-' + name);
      if (panel) panel.hidden = name !== tab;
    });

    if (tab === 'compare') renderCompare();
    if (tab === 'plans') renderPlans();
    if (tab === 'legacy') renderLegacy();

    if (!skipHash) {
      try {
        history.replaceState(null, '', '#' + tab);
      } catch (e) { /* file:// may refuse */ }
    }
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    $('themeIcon').textContent = state.theme === 'dark' ? '☀' : '☾';
    $('themeToggle').setAttribute('aria-label',
      state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage may be unavailable */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.keys(state).forEach(function (key) {
        if (saved[key] !== undefined && saved[key] !== null) state[key] = saved[key];
      });
      if (!MODEL_BY_ID[state.modelId]) state.modelId = 'claude-sonnet-5';
      if (!PLAN_BY_ID[state.planId]) state.planId = 'pro';
      if (typeof MODEL_BY_ID[state.legacyModelId] === 'undefined' ||
          typeof MODEL_BY_ID[state.legacyModelId].legacyMultiplier !== 'number') {
        state.legacyModelId = 'claude-sonnet-4.6';
      }
      state.input = Math.max(0, Number(state.input) || 0);
      state.cached = Math.max(0, Number(state.cached) || 0);
      state.cacheWrite = Math.max(0, Number(state.cacheWrite) || 0);
      state.output = Math.max(0, Number(state.output) || 0);
      state.seats = Math.max(1, Math.floor(Number(state.seats) || 1));
      state.used = Math.max(0, Number(state.used) || 0);
      state.legacyUses = Math.max(0, Number(state.legacyUses) || 0);
      state.legacyAllowance = Math.max(0, Number(state.legacyAllowance) || 0);

      var providers = [];
      DATA.models.forEach(function (m) {
        if (providers.indexOf(m.provider) === -1) providers.push(m.provider);
      });
      if (state.provider !== 'all' && providers.indexOf(state.provider) === -1) state.provider = 'all';
      if (['all', 'Lightweight', 'Versatile', 'Powerful'].indexOf(state.category) === -1) state.category = 'all';
      if (['credits-asc', 'credits-desc', 'name', 'input-asc', 'output-asc'].indexOf(state.sort) === -1) state.sort = 'credits-asc';
      if (['calculator', 'compare', 'plans', 'legacy'].indexOf(state.tab) === -1) state.tab = 'calculator';
      if (typeof state.search !== 'string') state.search = '';
    } catch (e) { /* ignore corrupt storage */ }
  }

  function bind() {
    $('modelSelect').addEventListener('change', function (e) {
      state.modelId = e.target.value;
      save();
      renderModelMeta();
      renderCalculator();
      renderCompare();
      renderPlans();
    });

    bindTokenInput('inputTokens', 'input');
    bindTokenInput('cachedTokens', 'cached');
    bindTokenInput('cacheWriteTokens', 'cacheWrite');
    bindTokenInput('outputTokens', 'output');

    $('presetRow').addEventListener('click', function (e) {
      var button = e.target.closest('button[data-preset]');
      if (!button) return;
      var preset = DATA.presets.filter(function (p) { return p.id === button.getAttribute('data-preset'); })[0];
      if (!preset) return;
      state.input = preset.tokens.input;
      state.cached = preset.tokens.cached;
      state.cacheWrite = preset.tokens.cacheWrite;
      state.output = preset.tokens.output;
      syncInputs();
      save();
      renderModelMeta();
      renderCalculator();
      renderCompare();
      renderPlans();
      document.querySelectorAll('.preset-chip').forEach(function (chip) {
        chip.classList.toggle('is-active', chip === button);
      });
    });

    $('planSelect').addEventListener('change', function (e) {
      state.planId = e.target.value;
      save();
      syncInputs();
      renderCalculator();
      renderCompare();
      renderPlans();
    });

    $('seatsInput').addEventListener('input', function (e) {
      var n = Math.floor(Number(e.target.value) || 1);
      state.seats = clamp(n, 1, 100000);
      $('usageSeats').value = String(state.seats);
      save();
      renderCalculator();
      renderCompare();
      renderPlans();
    });

    $('themeToggle').addEventListener('click', function () {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      save();
    });

    document.querySelectorAll('.tab').forEach(function (button) {
      button.addEventListener('click', function () {
        setTab(button.getAttribute('data-tab'));
      });
    });

    $('compareSearch').addEventListener('input', function (e) {
      state.search = e.target.value.trim();
      renderCompare();
    });

    $('providerFilter').addEventListener('change', function (e) {
      state.provider = e.target.value;
      renderCompare();
    });

    $('categoryFilter').addEventListener('change', function (e) {
      state.category = e.target.value;
      renderCompare();
    });

    $('sortSelect').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderCompare();
    });

    $('compareBody').addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-model-id]');
      if (row) selectModel(row.getAttribute('data-model-id'));
    });

    $('compareBody').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var row = e.target.closest('tr[data-model-id]');
      if (!row) return;
      e.preventDefault();
      selectModel(row.getAttribute('data-model-id'));
    });

    $('planGrid').addEventListener('click', function (e) {
      var card = e.target.closest('button[data-plan]');
      if (!card) return;
      state.planId = card.getAttribute('data-plan');
      save();
      syncInputs();
      renderCalculator();
      renderCompare();
      renderPlans();
    });

    $('usedCredits').addEventListener('input', function (e) {
      var parsed = parseTokens(e.target.value);
      if (isNaN(parsed)) {
        e.target.classList.add('is-invalid');
        return;
      }
      e.target.classList.remove('is-invalid');
      state.used = parsed;
      save();
      renderPlans();
    });
    $('usedCredits').addEventListener('blur', function (e) {
      if (!isNaN(parseTokens(e.target.value))) e.target.value = String(state.used);
    });

    $('usageSeats').addEventListener('input', function (e) {
      var n = Math.floor(Number(e.target.value) || 1);
      state.seats = clamp(n, 1, 100000);
      $('seatsInput').value = String(state.seats);
      save();
      renderCalculator();
      renderCompare();
      renderPlans();
    });

    $('resetUsage').addEventListener('click', function () {
      state.used = 0;
      $('usedCredits').value = '0';
      save();
      renderPlans();
    });

    $('legacyModel').addEventListener('change', function (e) {
      state.legacyModelId = e.target.value;
      save();
      renderLegacy();
    });

    $('legacyUses').addEventListener('input', function (e) {
      state.legacyUses = Math.max(0, Math.floor(Number(e.target.value) || 0));
      save();
      renderLegacy();
    });

    $('legacyAllowance').addEventListener('input', function (e) {
      state.legacyAllowance = Math.max(0, Math.floor(Number(e.target.value) || 0));
      save();
      renderLegacy();
    });

    window.addEventListener('hashchange', function () {
      setTab((location.hash || '').replace('#', ''), true);
    });
  }

  function init() {
    load();
    fillModelSelect();
    fillPlanSelect();
    fillProviderFilter();
    fillLegacySelect();
    $('presetRow').innerHTML = DATA.presets.map(function (p) {
      return '<button class="preset-chip" type="button" data-preset="' + esc(p.id) +
        '" title="' + esc(p.description) + '">' + esc(p.name) + '</button>';
    }).join('');
    $('dataBadge').textContent = 'Prices verified ' + DATA.meta.verified;
    $('footerDate').textContent = DATA.meta.verified;

    bind();
    applyTheme();
    syncInputs();

    var initial = (location.hash || '').replace('#', '');
    setTab(initial || state.tab, true);

    renderModelMeta();
    renderCalculator();
    renderCompare();
    renderPlans();
    renderLegacy();
  }

  init();
})();
