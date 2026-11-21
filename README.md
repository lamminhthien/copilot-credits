# Copilot Credits

A zero-build web app that estimates **GitHub Copilot AI-credit spend** for every supported model. Enter a token profile, pick a model, and see the cost in credits and dollars — then compare all models against your plan's monthly allowance.

**Live app:** https://lamminhthien.github.io/copilot-credits/

![no build](https://img.shields.io/badge/build-none-3ddc97) ![license](https://img.shields.io/badge/license-MIT-38bdf8) ![tests](https://github.com/lamminhthien/copilot-credits/actions/workflows/test.yml/badge.svg)

## Features

- **Token cost calculator** — input, cached input, cache-write and output tokens, with `1.5m` / `200k` shorthand.
- **All-model comparison** — the same token profile priced across 35 models, sortable and filterable, with the cheapest model highlighted.
- **Plan allowance tracker** — Free, Pro, Pro+, Max, Business, Enterprise and Student, including pooled per-seat pools, burn-down, days left, daily budget and overage.
- **Scenario presets** — quick chat, explain code, big refactor, agent session, huge context.
- **Long-context tiers** — automatically applies the higher rate once prompt tokens cross the model's threshold.
- **Legacy plans** — premium-request multipliers for Pro/Pro+ subscribers still on annual request-based billing.
- **No dependencies, no build step** — vanilla HTML, CSS and JS. Works offline from `file://` or any static host.

## Quick start

```bash
git clone https://github.com/lamminhthien/copilot-credits.git
cd copilot-credits
python3 -m http.server 8000
```

Open <http://localhost:8000>. You can also open `index.html` directly — no server required.

## How the estimate works

All prices in [`data/models.js`](data/models.js) are USD per **1,000,000 tokens**, as published by GitHub.

```text
usd = input/1M × inputRate
    + cached/1M × cachedRate
    + cacheWrite/1M × cacheWriteRate
    + output/1M × outputRate

credits = usd × 100          (1 credit = $0.01)
```

**Long context.** Tiers are ordered; the first tier whose `maxInput` is greater than or equal to the prompt size wins. Prompt size = uncached input + cached input + cache write. GitHub re-prices the whole request at the long-context rate once the threshold is crossed, so the app does the same.

**Cache writes.** Anthropic models and several newer OpenAI models bill a separate cache-write rate. Models without one (Google, Microsoft, xAI, Moonshot, older OpenAI) show the bucket as not billed.

**Allowances.** 1 credit = $0.01. Business and Enterprise credits are pooled: per-seat allowance × seats. Copilot Free and Student have an allowance, but GitHub does not publish the number.

| Plan | Price | Included credits |
| --- | ---: | ---: |
| Copilot Free | $0 | not published |
| Copilot Pro | $10/mo | 1,500 (1,000 base + 500 flex) |
| Copilot Pro+ | $39/mo | 7,000 (3,900 base + 3,100 flex) |
| Copilot Max | $100/mo | 20,000 (10,000 base + 10,000 flex) |
| Copilot Business | $19/user/mo | 1,900 per seat, pooled |
| Copilot Enterprise | $39/user/mo | 3,900 per seat, pooled |
| Copilot Student | $0 | not published |

Code completions and next-edit suggestions do **not** consume AI credits. Auto model selection gets a 10% discount on paid plans; Copilot Fusion has a 30% discount through 2026-11-30.

## Data coverage

- 35 text models from OpenAI, Anthropic, Google, Microsoft, xAI and Moonshot AI.
- Promotional prices are marked with a `promo` badge; notes carry the expiry date.
- The GPT Image 2.5 Flare image model is **not** included — it has separate text, image-input and image-output rates that don't fit the text-token calculator.
- Copilot code review is priced by effort level (Lite ≈ $0.25, Balanced ≈ $1.50, Max ≈ $10 per review) rather than by a model, so it is not in the model table.

Pricing verified **2026-11-21**. Model availability and prices change; the app is an estimator, not a billing statement.

## Updating prices

1. Edit the relevant entry in [`data/models.js`](data/models.js).
2. Bump `meta.verified` to today's date (shown in the header and footer).
3. Run the tests.

Each model uses this shape:

```js
{
  id: "claude-sonnet-5",
  name: "Claude Sonnet 5",
  provider: "Anthropic",
  category: "Versatile",          // Lightweight | Versatile | Powerful
  status: "GA",                   // GA | Preview | Legacy
  legacyMultiplier: 9,            // optional, annual request-based plans
  promoUntil: "2026-12-01",       // optional
  note: "…",                      // optional
  tiers: [
    { label: "Default", maxInput: 100000, input: 2.0, cached: 0.2, cacheWrite: 2.5, output: 10.0 },
    { label: "Long context", maxInput: null, input: 4.0, cached: 0.4, cacheWrite: 5.0, output: 20.0 }
  ]
}
```

`maxInput: null` marks the open-ended final tier. `cacheWrite: null` means the model has no cache-write rate.

## Tests

The pricing math lives in [`assets/calc.js`](assets/calc.js) and is DOM-free, so it can be tested in any JS engine.

```bash
node tests/run.js
```

With only Python available (no Node), use the bundled QuickJS runner:

```bash
pip install quickjs
python3 tests/run-tests.py
```

16 tests cover tier thresholds, cache-write handling, token parsing, plan pools, data integrity and legacy multipliers.

## Project structure

```text
index.html            single-page UI
assets/styles.css     dark/light theme, responsive layout
assets/calc.js        pure pricing math (testable)
assets/app.js         state, rendering and events
data/models.js        model prices, plans, presets, legacy multipliers
tests/calc.test.js    math and data tests
tests/run.js          Node test runner
tests/run-tests.py    QuickJS test runner
```

## Sources

- [Models and pricing for GitHub Copilot](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
- [Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing)
- [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing)
- [Model multipliers for annual plans (legacy)](https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/model-multipliers-for-annual-plans)

## License

MIT © 2026 lamminhthien
