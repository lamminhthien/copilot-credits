/*
 * GitHub Copilot pricing data
 * ---------------------------
 * All prices are USD per 1,000,000 tokens, as published by GitHub.
 * 1 GitHub AI Credit = $0.01 USD, so credits = USD * 100.
 *
 * Source: https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing
 * Plan allowances: https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
 * Org allowances: https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing
 * Legacy multipliers: https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/model-multipliers-for-annual-plans
 *
 * `maxInput: null` means the tier has no input-token ceiling.
 * `cacheWrite: null` means the model does not bill a separate cache-write rate.
 * Verified 2026-11-21.
 */
window.COPILOT_DATA = {
  meta: {
    verified: "2026-11-21",
    creditUsd: 0.01,
    pricingSource: "https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing",
    plansSource: "https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing",
    legacySource: "https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/model-multipliers-for-annual-plans"
  },

  plans: [
    {
      id: "free",
      name: "Copilot Free",
      price: 0,
      base: null,
      flex: null,
      total: null,
      note: "GitHub publishes an AI-credit allowance for Free, but not the amount. Auto model selection only."
    },
    {
      id: "pro",
      name: "Copilot Pro",
      price: 10,
      base: 1000,
      flex: 500,
      total: 1500,
      note: "1,000 base credits + 500 flex credits."
    },
    {
      id: "proplus",
      name: "Copilot Pro+",
      price: 39,
      base: 3900,
      flex: 3100,
      total: 7000,
      note: "3,900 base credits + 3,100 flex credits."
    },
    {
      id: "max",
      name: "Copilot Max",
      price: 100,
      base: 10000,
      flex: 10000,
      total: 20000,
      note: "10,000 base credits + 10,000 flex credits."
    },
    {
      id: "business",
      name: "Copilot Business",
      price: 19,
      base: 1900,
      flex: 0,
      total: 1900,
      pooled: true,
      note: "1,900 credits per seat, pooled across the billing entity."
    },
    {
      id: "enterprise",
      name: "Copilot Enterprise",
      price: 39,
      base: 3900,
      flex: 0,
      total: 3900,
      pooled: true,
      note: "3,900 credits per seat, pooled across the billing entity."
    },
    {
      id: "student",
      name: "Copilot Student",
      price: 0,
      base: null,
      flex: null,
      total: null,
      note: "Allowance not published. Auto model selection only; unlimited code completions."
    }
  ],

  models: [
    // ---------------------------------------------------------------- OpenAI
    {
      id: "gpt-5.3-codex",
      name: "GPT-5.3-Codex",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      legacyMultiplier: 6,
      tiers: [{ label: "Default", maxInput: null, input: 1.75, cached: 0.175, cacheWrite: null, output: 14.0 }]
    },
    {
      id: "gpt-5.4-nano",
      name: "GPT-5.4 nano",
      provider: "OpenAI",
      category: "Lightweight",
      status: "GA",
      note: "Only in the Codex VS Code extension (Copilot Pro+); not available in Copilot Chat.",
      tiers: [{ label: "Default", maxInput: null, input: 0.2, cached: 0.02, cacheWrite: null, output: 1.25 }]
    },
    {
      id: "gpt-5.6-luna",
      name: "GPT-5.6 Luna",
      provider: "OpenAI",
      category: "Lightweight",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 200000, input: 0.2, cached: 0.02, cacheWrite: 0.25, output: 1.2 },
        { label: "Long context", maxInput: null, input: 0.4, cached: 0.04, cacheWrite: 0.5, output: 1.8 }
      ]
    },
    {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 4.0, cached: 0.4, cacheWrite: 5.0, output: 20.0 },
        { label: "Long context", maxInput: null, input: 8.0, cached: 0.8, cacheWrite: 10.0, output: 30.0 }
      ]
    },
    {
      id: "gpt-6-astra",
      name: "GPT-6 Astra",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 10.0, cached: 1.0, cacheWrite: 12.5, output: 50.0 },
        { label: "Long context", maxInput: null, input: 20.0, cached: 2.0, cacheWrite: 25.0, output: 75.0 }
      ]
    },
    {
      id: "gpt-6-luna",
      name: "GPT-6 Luna",
      provider: "OpenAI",
      category: "Lightweight",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 0.1, cached: 0.01, cacheWrite: 0.125, output: 0.5 },
        { label: "Long context", maxInput: null, input: 0.2, cached: 0.02, cacheWrite: 0.25, output: 0.75 }
      ]
    },
    {
      id: "gpt-6-sol",
      name: "GPT-6 Sol",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 2.0, cached: 0.2, cacheWrite: 2.5, output: 10.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 0.4, cacheWrite: 5.0, output: 15.0 }
      ]
    },
    {
      id: "gpt-6.1-sol",
      name: "GPT-6.1 Sol",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 2.0, cached: 0.1, cacheWrite: 2.5, output: 10.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 0.2, cacheWrite: 5.0, output: 15.0 }
      ]
    },
    {
      id: "gpt-6.1-terra",
      name: "GPT-6.1 Terra",
      provider: "OpenAI",
      category: "Versatile",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 1.0, cached: 0.05, cacheWrite: 1.25, output: 5.0 },
        { label: "Long context", maxInput: null, input: 2.0, cached: 0.1, cacheWrite: 2.5, output: 7.5 }
      ]
    },
    {
      id: "gpt-6.2-astra",
      name: "GPT-6.2 Astra",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 8.0, cached: 0.4, cacheWrite: 10.0, output: 40.0 },
        { label: "Long context", maxInput: null, input: 16.0, cached: 0.8, cacheWrite: 20.0, output: 60.0 }
      ]
    },
    {
      id: "gpt-6.2-sol",
      name: "GPT-6.2 Sol",
      provider: "OpenAI",
      category: "Powerful",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 272000, input: 2.0, cached: 0.1, cacheWrite: 2.5, output: 10.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 0.2, cacheWrite: 5.0, output: 15.0 }
      ]
    },

    // ------------------------------------------------------------- Anthropic
    {
      id: "claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      provider: "Anthropic",
      category: "Versatile",
      status: "GA",
      legacyMultiplier: 0.33,
      tiers: [{ label: "Default", maxInput: null, input: 1.0, cached: 0.1, cacheWrite: 1.25, output: 5.0 }]
    },
    {
      id: "claude-haiku-5.5",
      name: "Claude Haiku 5.5",
      provider: "Anthropic",
      category: "Lightweight",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 100000, input: 0.1, cached: 0.01, cacheWrite: 0.125, output: 0.5 },
        { label: "Long context", maxInput: null, input: 0.5, cached: 0.05, cacheWrite: 0.625, output: 2.5 }
      ]
    },
    {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
      provider: "Anthropic",
      category: "Versatile",
      status: "Legacy",
      note: "Still listed in GitHub's price table, but no longer in the supported-models list.",
      tiers: [{ label: "Default", maxInput: null, input: 3.0, cached: 0.3, cacheWrite: 3.75, output: 15.0 }]
    },
    {
      id: "claude-sonnet-4.6",
      name: "Claude Sonnet 4.6",
      provider: "Anthropic",
      category: "Versatile",
      status: "GA",
      legacyMultiplier: 9,
      annualOnly: true,
      note: "Retired for monthly plans on 2026-09-01; still available on legacy annual Pro/Pro+ plans.",
      tiers: [{ label: "Default", maxInput: null, input: 3.0, cached: 0.3, cacheWrite: 3.75, output: 15.0 }]
    },
    {
      id: "claude-opus-4.8",
      name: "Claude Opus 4.8",
      provider: "Anthropic",
      category: "Powerful",
      status: "GA",
      legacyMultiplier: 27,
      annualOnly: true,
      note: "Retired for monthly plans on 2026-11-16; still available on legacy annual plans.",
      tiers: [{ label: "Default", maxInput: null, input: 5.0, cached: 0.5, cacheWrite: 6.25, output: 25.0 }]
    },
    {
      id: "claude-opus-4.8-fast",
      name: "Claude Opus 4.8 (fast mode)",
      provider: "Anthropic",
      category: "Powerful",
      status: "Preview",
      tiers: [{ label: "Default", maxInput: null, input: 10.0, cached: 1.0, cacheWrite: 12.5, output: 50.0 }]
    },
    {
      id: "claude-opus-5.5",
      name: "Claude Opus 5.5",
      provider: "Anthropic",
      category: "Powerful",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 4.0, cached: 0.2, cacheWrite: 5.0, output: 20.0 }]
    },
    {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      provider: "Anthropic",
      category: "Versatile",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 2.0, cached: 0.2, cacheWrite: 2.5, output: 10.0 }]
    },
    {
      id: "claude-sonnet-5.5",
      name: "Claude Sonnet 5.5",
      provider: "Anthropic",
      category: "Versatile",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 2.0, cached: 0.1, cacheWrite: 2.5, output: 10.0 }]
    },
    {
      id: "claude-fable-5",
      name: "Claude Fable 5",
      provider: "Anthropic",
      category: "Powerful",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 10.0, cached: 1.0, cacheWrite: 12.5, output: 50.0 }]
    },
    {
      id: "claude-fable-5.1",
      name: "Claude Fable 5.1",
      provider: "Anthropic",
      category: "Powerful",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 10.0, cached: 0.25, cacheWrite: 12.5, output: 50.0 }]
    },
    {
      id: "claude-fable-5.2",
      name: "Claude Fable 5.2",
      provider: "Anthropic",
      category: "Powerful",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 8.0, cached: 0.2, cacheWrite: 10.0, output: 40.0 }]
    },

    // ---------------------------------------------------------------- Google
    {
      id: "gemini-3.8-flash",
      name: "Gemini 3.8 Flash",
      provider: "Google",
      category: "Versatile",
      status: "GA",
      promoUntil: "2026-12-31",
      note: "Promotional pricing through 2026-12-31.",
      tiers: [{ label: "Default", maxInput: null, input: 0.75, cached: 0.075, cacheWrite: null, output: 3.75 }]
    },
    {
      id: "gemini-4-argon",
      name: "Gemini 4 Argon",
      provider: "Google",
      category: "Powerful",
      status: "GA",
      promoUntil: "2026-12-01",
      note: "Promotional pricing until 2026-12-01.",
      tiers: [{ label: "Default", maxInput: null, input: 2.0, cached: 0.1, cacheWrite: null, output: 10.0 }]
    },
    {
      id: "gemini-4-carbon",
      name: "Gemini 4 Carbon",
      provider: "Google",
      category: "Powerful",
      status: "GA",
      promoUntil: "2026-12-01",
      note: "Promo until 2026-12-01, then $4.00 input / $0.20 cached / $20.00 output per 1M.",
      tiers: [{ label: "Default", maxInput: null, input: 2.0, cached: 0.1, cacheWrite: null, output: 10.0 }]
    },
    {
      id: "gemini-4-hydrogen",
      name: "Gemini 4 Hydrogen",
      provider: "Google",
      category: "Versatile",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 1.5, cached: 0.075, cacheWrite: null, output: 7.5 }]
    },
    {
      id: "gemini-4-neon",
      name: "Gemini 4 Neon",
      provider: "Google",
      category: "Versatile",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 3.0, cached: 0.15, cacheWrite: null, output: 15.0 }]
    },

    // ------------------------------------------------------------- Microsoft
    {
      id: "mai-code-1.1-flash",
      name: "MAI-Code-1.1-Flash",
      provider: "Microsoft",
      category: "Lightweight",
      status: "GA",
      legacyMultiplier: 0.25,
      tiers: [{ label: "Default", maxInput: null, input: 0.2, cached: 0.02, cacheWrite: null, output: 1.2 }]
    },
    {
      id: "mai-code-2",
      name: "MAI Code 2",
      provider: "Microsoft",
      category: "Powerful",
      status: "GA",
      legacyMultiplier: 1,
      promoUntil: "2027-05-17",
      note: "Promo until 2027-05-17, then $1.00 input / $0.05 cached / $5.00 output per 1M.",
      tiers: [{ label: "Default", maxInput: null, input: 0.5, cached: 0.025, cacheWrite: null, output: 2.5 }]
    },
    {
      id: "mai-code-2-flash",
      name: "MAI Code 2 Flash",
      provider: "Microsoft",
      category: "Lightweight",
      status: "GA",
      legacyMultiplier: 0.33,
      promoUntil: "2027-05-17",
      note: "Promo until 2027-05-17, then $0.10 input / $0.01 cached / $0.50 output per 1M.",
      tiers: [{ label: "Default", maxInput: null, input: 0.05, cached: 0.005, cacheWrite: null, output: 0.25 }]
    },

    // ------------------------------------------------------------------- xAI
    {
      id: "grok-4.5",
      name: "Grok 4.5",
      provider: "xAI",
      category: "Versatile",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 200000, input: 2.0, cached: 0.5, cacheWrite: null, output: 6.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 1.0, cacheWrite: null, output: 12.0 }
      ]
    },
    {
      id: "grok-4.6",
      name: "Grok 4.6",
      provider: "xAI",
      category: "Versatile",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 200000, input: 2.0, cached: 0.5, cacheWrite: null, output: 6.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 1.0, cacheWrite: null, output: 12.0 }
      ]
    },
    {
      id: "grok-4.7",
      name: "Grok 4.7",
      provider: "xAI",
      category: "Versatile",
      status: "GA",
      tiers: [
        { label: "Default", maxInput: 200000, input: 2.0, cached: 0.5, cacheWrite: null, output: 6.0 },
        { label: "Long context", maxInput: null, input: 4.0, cached: 1.0, cacheWrite: null, output: 12.0 }
      ]
    },

    // ------------------------------------------------------------- Moonshot
    {
      id: "kimi-k3",
      name: "Kimi K3",
      provider: "Moonshot AI",
      category: "Powerful",
      status: "GA",
      tiers: [{ label: "Default", maxInput: null, input: 3.0, cached: 0.3, cacheWrite: null, output: 15.0 }]
    }
  ],

  presets: [
    {
      id: "chat",
      name: "Quick chat",
      description: "A short question with a little context.",
      tokens: { input: 1500, cached: 6000, cacheWrite: 0, output: 400 }
    },
    {
      id: "explain",
      name: "Explain code",
      description: "Paste a file, ask for a walkthrough.",
      tokens: { input: 8000, cached: 24000, cacheWrite: 0, output: 1200 }
    },
    {
      id: "refactor",
      name: "Big refactor",
      description: "Multi-file edit with a long conversation.",
      tokens: { input: 30000, cached: 90000, cacheWrite: 20000, output: 6000 }
    },
    {
      id: "agent",
      name: "Agent session",
      description: "Cloud agent working across a large repo.",
      tokens: { input: 150000, cached: 450000, cacheWrite: 100000, output: 15000 }
    },
    {
      id: "long",
      name: "Huge context",
      description: "Enough prompt tokens to trigger long-context pricing.",
      tokens: { input: 400000, cached: 100000, cacheWrite: 0, output: 8000 }
    }
  ],

  legacy: {
    allowanceDefaults: { pro: 300, proplus: 1500 },
    codeReviewMultiplier: 13,
    autoDiscount: 0.1
  }
};
