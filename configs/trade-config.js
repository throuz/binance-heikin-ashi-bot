export const SYMBOL = "BTCUSDT";
export const QUOTE_ASSET = "USDT";
export const ORDER_AMOUNT_PERCENT = 100; // 100%
export const LONG_TERM_KLINE_INTERVAL = "1d";
export const KLINE_INTERVAL = "1h";
export const KLINE_LIMIT = 1500;

// Only for backtest
export const INITIAL_FUNDING = 100;
export const FEE = 0.0005; // 0.05%
export const FUNDING_RATE = 0.0001; // 0.01%
export const AVG_VOL_PERIOD_SETTING = { min: 30, max: 50, step: 1 };
export const OPEN_AVG_VOL_FACTOR_SETTING = { min: 0.5, max: 1, step: 0.05 };
export const CLOSE_AVG_VOL_FACTOR_SETTING = { min: 1, max: 2, step: 0.05 };
export const LEVERAGE_SETTING = { min: 30, max: 50, step: 1 };
export const RANDOM_SAMPLE_NUMBER = 100000;
export const KLINE_START_TIME = null; // timestamp
export const IS_KLINE_START_TIME_TO_NOW = true;
