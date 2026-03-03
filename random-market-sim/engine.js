/**
 * Random Walk Market Engine
 * Generates realistic OHLCV candlestick data using geometric Brownian motion.
 */
class MarketEngine {
  constructor({ initialPrice = 100, volatility = 0.02, drift = 0 } = {}) {
    this.initialPrice = initialPrice;
    this.volatility = volatility;   // σ per candle
    this.drift = drift;             // μ per candle
    this.lastClose = initialPrice;
    this.candleIndex = 0;
    this.baseTime = new Date('2024-01-01').getTime() / 1000; // epoch seconds
  }

  /** Reset the engine to initial state */
  reset(params = {}) {
    if (params.initialPrice !== undefined) this.initialPrice = params.initialPrice;
    if (params.volatility !== undefined)   this.volatility = params.volatility;
    if (params.drift !== undefined)        this.drift = params.drift;
    this.lastClose = this.initialPrice;
    this.candleIndex = 0;
  }

  /** Box-Muller transform for normal distribution */
  _randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /** Generate a single OHLCV candle */
  nextCandle() {
    const sigma = this.volatility / 100;
    const mu = this.drift / 100;

    const open = this.lastClose;

    // Simulate intra-candle price path (8 ticks)
    const ticks = [open];
    let price = open;
    for (let i = 0; i < 8; i++) {
      const r = this._randn();
      const change = price * (mu / 8 + sigma * r / Math.sqrt(8));
      price = Math.max(price + change, 0.01);
      ticks.push(price);
    }

    const close = ticks[ticks.length - 1];
    const high = Math.max(...ticks) * (1 + Math.random() * sigma * 0.3);
    const low  = Math.min(...ticks) * (1 - Math.random() * sigma * 0.3);

    // Volume with some randomness, bigger on large bars
    const barSize = Math.abs(close - open) / open;
    const baseVol = 500000 + Math.random() * 1500000;
    const volume = Math.round(baseVol * (1 + barSize * 20));

    const time = this.baseTime + this.candleIndex * 86400; // 1 day per candle

    this.lastClose = close;
    this.candleIndex++;

    return {
      time,
      open:  +open.toFixed(4),
      high:  +Math.max(high, open, close).toFixed(4),
      low:   +Math.min(low, open, close).toFixed(4),
      close: +close.toFixed(4),
      volume
    };
  }

  /** Generate N candles at once */
  generateBatch(count) {
    const candles = [];
    for (let i = 0; i < count; i++) {
      candles.push(this.nextCandle());
    }
    return candles;
  }

  /** Compute Simple Moving Average from candle data */
  static sma(candles, period) {
    const result = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      result.push({ time: candles[i].time, value: +(sum / period).toFixed(4) });
    }
    return result;
  }

  /** Compute Exponential Moving Average from candle data */
  static ema(candles, period) {
    const result = [];
    const k = 2 / (period + 1);
    let ema = candles[0].close;

    for (let i = 0; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
      if (i >= period - 1) {
        result.push({ time: candles[i].time, value: +ema.toFixed(4) });
      }
    }
    return result;
  }
}
