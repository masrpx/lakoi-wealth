import type { AssetSignal, SignalColor, SignalStrength, IndicatorBreakdown } from "@/types/growthPortfolio";

// Tickers treated as income/cash assets — skip technical signals
const INCOME_TICKERS = new Set(["SGOV", "BIL", "SHV", "TLT", "IEF", "AGG", "BND", "GOVT", "VGIT", "VGSH"]);

function isCrypto(ticker: string): boolean {
  return ticker.endsWith("-USD");
}

/** Wilder RSI(14) */
export function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** EMA series — values aligned to closes[period-1..end] */
export function computeEMASeries(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const result = [ema];
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function lastEMA(closes: number[], period: number): number | null {
  const series = computeEMASeries(closes, period);
  return series.length > 0 ? series[series.length - 1] : null;
}

export function compute52wHigh(highs: number[]): number {
  return Math.max(...highs.slice(-252));
}

// ─── Per-indicator scoring ────────────────────────────────────────────────────

function scoreRSI(rsi: number): IndicatorBreakdown {
  if (rsi < 30) return { label: "RSI(14)", detail: `${rsi.toFixed(1)} — oversold`, points: 2, color: "green" };
  if (rsi < 50) return { label: "RSI(14)", detail: `${rsi.toFixed(1)} — leaning bearish`, points: 1, color: "yellow" };
  if (rsi <= 70) return { label: "RSI(14)", detail: `${rsi.toFixed(1)} — leaning bullish`, points: 0, color: "yellow" };
  return { label: "RSI(14)", detail: `${rsi.toFixed(1)} — overbought`, points: -2, color: "red" };
}

function scoreEMACross(ema20: number, ema50: number): IndicatorBreakdown {
  const bullish = ema20 > ema50;
  const pct = Math.abs(((ema20 - ema50) / ema50) * 100).toFixed(2);
  return {
    label: "EMA 20/50",
    detail: bullish ? `Bullish cross (+${pct}% gap)` : `Bearish cross (-${pct}% gap)`,
    points: bullish ? 1 : -1,
    color: bullish ? "green" : "red",
  };
}

function scoreVsEMA200(price: number, ema200: number | null): IndicatorBreakdown {
  if (ema200 === null) {
    return { label: "vs EMA200", detail: "Insufficient history (<200 days)", points: 0, color: "yellow" };
  }
  const above = price > ema200;
  const pct = Math.abs(((price - ema200) / ema200) * 100).toFixed(1);
  return {
    label: "vs EMA200",
    detail: above ? `Above long-term trend (+${pct}%)` : `Below long-term trend (-${pct}%)`,
    points: above ? 1 : -1,
    color: above ? "green" : "red",
  };
}

function score52wHighDist(dist: number, crypto: boolean): IndicatorBreakdown {
  // Crypto uses wider thresholds (markets are more volatile)
  const strongBuyAt = crypto ? 30 : 20;
  const neutralAt   = crypto ? 15 : 10;
  const avoidAt     = crypto ? 10 : 5;

  let points: number;
  let detail: string;
  let color: SignalColor;

  if (dist >= strongBuyAt) {
    points = 2; color = "green";
    detail = `${dist.toFixed(1)}% below 52w high — deep value`;
  } else if (dist >= neutralAt) {
    points = 1; color = "yellow";
    detail = `${dist.toFixed(1)}% below 52w high — moderate pullback`;
  } else if (dist < avoidAt) {
    points = -2; color = "red";
    detail = `${dist.toFixed(1)}% below 52w high — near highs, stretched`;
  } else {
    points = 0; color = "yellow";
    detail = `${dist.toFixed(1)}% below 52w high — neutral zone`;
  }

  return { label: "52w High Distance", detail, points, color };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function computeAssetSignal(
  ticker: string,
  closes: number[],
  highs: number[],
  price: number
): AssetSignal {
  // Income assets: skip all indicators
  if (INCOME_TICKERS.has(ticker)) {
    return {
      ticker,
      rsi: 50, ema20: price, ema50: price, ema200: null,
      distFrom52wHigh: 0,
      rsiSignal: "yellow", emaCross: "yellow", vsEma200: "yellow", dist52wSignal: "yellow",
      score: 0,
      breakdown: [],
      composite: "HOLD",
      hasEnoughData: true,
      isIncomeAsset: true,
      incomeLabel: "HOLD — Income / Cash Asset",
    };
  }

  const hasEnoughData = closes.length >= 50;

  if (!hasEnoughData) {
    return {
      ticker,
      rsi: 50, ema20: price, ema50: price, ema200: null,
      distFrom52wHigh: 0,
      rsiSignal: "yellow", emaCross: "yellow", vsEma200: "yellow", dist52wSignal: "yellow",
      score: 0,
      breakdown: [],
      composite: "HOLD",
      hasEnoughData: false,
      isIncomeAsset: false,
    };
  }

  const rsi = computeRSI(closes);
  const ema20 = lastEMA(closes, 20) ?? price;
  const ema50 = lastEMA(closes, 50) ?? price;
  const ema200 = lastEMA(closes, 200);
  const high52w = compute52wHigh(highs.length >= 50 ? highs : closes);
  const dist = high52w > 0 ? ((high52w - price) / high52w) * 100 : 0;
  const crypto = isCrypto(ticker);

  const b1 = scoreRSI(rsi);
  const b2 = scoreEMACross(ema20, ema50);
  const b3 = scoreVsEMA200(price, ema200);
  const b4 = score52wHighDist(dist, crypto);

  const breakdown = [b1, b2, b3, b4];
  const score = breakdown.reduce((s, b) => s + b.points, 0);

  const composite: SignalStrength = score >= 3 ? "BUY" : score < 0 ? "AVOID" : "HOLD";

  // Signal colors for dot display (derived from breakdown colors)
  const rsiSignal: SignalColor = b1.color;
  const emaCross: SignalColor = b2.color;
  const vsEma200: SignalColor = b3.color;
  const dist52wSignal: SignalColor = b4.color;

  return {
    ticker, rsi, ema20, ema50, ema200, distFrom52wHigh: dist,
    rsiSignal, emaCross, vsEma200, dist52wSignal,
    score, breakdown, composite,
    hasEnoughData: true, isIncomeAsset: false,
  };
}
