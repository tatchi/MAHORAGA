import { z } from "zod";

const BarsTimeframeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    const upper = trimmed.toUpperCase();
    if (upper === "1D") {
      return "1Day";
    }
    if (upper === "1H") {
      return "1Hour";
    }
    return trimmed;
  },
  z.enum(["1Min", "5Min", "15Min", "1Hour", "1Day"])
);

export const AgentConfigSchema = z
  .object({
    data_poll_interval_ms: z.number().min(5000).max(300000),
    analyst_interval_ms: z.number().min(30000).max(600000),

    premarket_plan_window_minutes: z.number().min(1).max(60),
    market_open_execute_window_minutes: z.number().min(0).max(10),

    max_position_value: z.number().positive().max(100000),
    max_positions: z.number().int().min(1).max(50),
    min_sentiment_score: z.number().min(0).max(1),
    min_analyst_confidence: z.number().min(0).max(1),

    take_profit_pct: z.number().min(1).max(100),
    stop_loss_pct: z.number().min(1).max(50),
    position_size_pct_of_cash: z.number().min(1).max(100),

    // Entry quality gates (market-data based)
    entry_gates_apply_to_crypto: z.boolean().default(false),
    entry_min_price: z.number().min(0).max(100000).default(2),
    entry_min_dollar_volume: z.number().min(0).max(1_000_000_000_000).default(10_000_000),
    entry_max_spread_bps: z.number().min(0).max(10000).default(50),
    entry_trend_timeframe: BarsTimeframeSchema.default("1Hour"),
    entry_trend_lookback_bars: z.number().int().min(2).max(200).default(20),
    entry_min_trend_return_pct: z.number().min(-100).max(100).default(0.5),

    // Market regime filter
    regime_filter_enabled: z.boolean().default(false),
    regime_symbol: z.string().min(1).default("SPY"),
    regime_timeframe: BarsTimeframeSchema.default("1Day"),
    regime_lookback_bars: z.number().int().min(2).max(200).default(50),
    regime_min_return_pct: z.number().min(-100).max(100).default(0),

    stale_position_enabled: z.boolean(),
    stale_min_hold_hours: z.number().min(0).max(168),
    stale_max_hold_days: z.number().min(1).max(30),
    stale_min_gain_pct: z.number().min(0).max(100),
    stale_mid_hold_days: z.number().min(1).max(30),
    stale_mid_min_gain_pct: z.number().min(0).max(100),
    stale_social_volume_decay: z.number().min(0).max(1),

    llm_provider: z.enum(["openai-raw", "ai-sdk", "cloudflare-gateway"]),
    llm_model: z.string().min(1),
    llm_analyst_model: z.string().min(1),
    llm_min_hold_minutes: z.number().int().min(0).max(1440).default(30),

    options_enabled: z.boolean(),
    options_min_confidence: z.number().min(0).max(1),
    options_max_pct_per_trade: z.number().min(0).max(0.25),
    options_min_dte: z.number().int().min(1).max(365),
    options_max_dte: z.number().int().min(1).max(365),
    options_target_delta: z.number().min(0.1).max(0.9),
    options_min_delta: z.number().min(0.1).max(0.9),
    options_max_delta: z.number().min(0.1).max(0.9),
    options_stop_loss_pct: z.number().min(1).max(100),
    options_take_profit_pct: z.number().min(1).max(500),

    crypto_enabled: z.boolean(),
    crypto_symbols: z.array(z.string()),
    crypto_momentum_threshold: z.number().min(0.1).max(20),
    crypto_max_position_value: z.number().positive().max(100000),
    crypto_take_profit_pct: z.number().min(1).max(100),
    crypto_stop_loss_pct: z.number().min(1).max(50),

    ticker_blacklist: z.array(z.string()),
    allowed_exchanges: z.array(z.string()).default(["NYSE", "NASDAQ", "ARCA", "AMEX", "BATS"]),
  })
  .refine((data) => data.options_min_delta < data.options_max_delta, {
    message: "options_min_delta must be less than options_max_delta",
    path: ["options_min_delta"],
  })
  .refine((data) => data.options_min_dte < data.options_max_dte, {
    message: "options_min_dte must be less than options_max_dte",
    path: ["options_min_dte"],
  })
  .refine((data) => data.stale_mid_hold_days <= data.stale_max_hold_days, {
    message: "stale_mid_hold_days must be <= stale_max_hold_days",
    path: ["stale_mid_hold_days"],
  });

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export function validateAgentConfig(config: unknown): AgentConfig {
  return AgentConfigSchema.parse(config);
}

export function safeValidateAgentConfig(
  config: unknown
): { success: true; data: AgentConfig } | { success: false; error: z.ZodError } {
  const result = AgentConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
