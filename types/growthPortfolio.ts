export type Bucket = "Core" | "Growth" | "Hedge" | "Speculative";

export interface PortfolioAsset {
  id: string;
  ticker: string;
  name: string;
  targetWeight: number; // %
  bucket: Bucket;
  manualValueTHB: number; // ฿ fallback when no DCA entries
  unitsHeld: number; // primary: units × live price = current value; 0 = not set
  // Crypto breakdown — when either is set, overrides unitsHeld
  hardWalletUnits?: number;
  exchangeUnits?: number;
}

export interface DCAEntry {
  id: string;
  assetId: string;
  date: string; // ISO date string YYYY-MM-DD
  amountThb: number;
  priceAtPurchase: number; // ฿
  unitsAdded: number;
}

export interface PriceData {
  ticker: string;
  price: number;
  prevClose: number;
  closes: number[]; // daily closes, up to 252 days
  highs: number[];  // daily highs, up to 252 days
  updatedAt: number; // unix ms
  stale: boolean;
}

export type SignalColor = "green" | "yellow" | "red";
export type SignalStrength = "BUY" | "HOLD" | "AVOID";

export interface IndicatorBreakdown {
  label: string;
  detail: string;
  points: number; // +2, +1, 0, -1, -2
  color: SignalColor;
}

export interface AssetSignal {
  ticker: string;
  // Raw indicator values
  rsi: number;
  ema20: number;
  ema50: number;
  ema200: number | null;
  distFrom52wHigh: number; // % below 52w high
  // Per-indicator signal colors (for dot display)
  rsiSignal: SignalColor;
  emaCross: SignalColor;
  vsEma200: SignalColor;
  dist52wSignal: SignalColor;
  // Weighted scoring
  score: number;
  breakdown: IndicatorBreakdown[];
  composite: SignalStrength;
  hasEnoughData: boolean;
  isIncomeAsset: boolean;
  incomeLabel?: string;
}
