import type { Bucket } from "@/types/growthPortfolio";

// ±25% relative band for Core/Growth; ±43%/±29% for Hedge/Speculative.
// These factors reproduce the v2 plan numbers almost exactly:
//   BTC 21% → trim 26.25, add 15.75 (v2: 26/16)
//   GOOG 10.5% → trim 13.1, add 7.9 (v2: 13/8)
//   NVDA 7% → trim 8.75, add 5.25 (v2: 9/5)
//   SOFI 3.5% → trim 5.0, add 2.5 (v2: 5/2)
//   Hedge combined 7% → trim 10.0, add 4.97 (v2: 10/5)
function bandFactors(bucket: Bucket): { trimFactor: number; addFactor: number } {
  if (bucket === "Speculative" || bucket === "Hedge") {
    return { trimFactor: 1.43, addFactor: 0.71 };
  }
  return { trimFactor: 1.25, addFactor: 0.75 };
}

export function rebalAction(
  actualPct: number,
  targetWeight: number,
  bucket: Bucket,
): "TRIM" | "ADD" | null {
  const { trimFactor, addFactor } = bandFactors(bucket);
  if (actualPct > targetWeight * trimFactor) return "TRIM";
  if (actualPct < targetWeight * addFactor) return "ADD";
  return null;
}

export type BtcZone = "ADD" | "HOLD" | "TRIM" | "TRIM_URGENT";

export function btcZone(btcActualPct: number, btcTargetWeight: number): BtcZone {
  const { trimFactor, addFactor } = bandFactors("Core");
  const urgentFactor = 1.43;
  if (btcActualPct > btcTargetWeight * urgentFactor) return "TRIM_URGENT";
  if (btcActualPct > btcTargetWeight * trimFactor) return "TRIM";
  if (btcActualPct < btcTargetWeight * addFactor) return "ADD";
  return "HOLD";
}

export function crashLevel(high52w: number, currentPrice: number): 0 | 1 | 2 | 3 | 4 {
  if (high52w <= 0 || currentPrice <= 0) return 0;
  const drawdown = ((high52w - currentPrice) / high52w) * 100;
  if (drawdown >= 40) return 4;
  if (drawdown >= 30) return 3;
  if (drawdown >= 20) return 2;
  if (drawdown >= 10) return 1;
  return 0;
}

export function spyDrawdownPct(high52w: number, currentPrice: number): number {
  if (high52w <= 0 || currentPrice <= 0) return 0;
  return ((high52w - currentPrice) / high52w) * 100;
}

export interface ThesisReview {
  label: string; // e.g. "July 2026"
  daysUntil: number;
  isOverdue: boolean;
}

export function nextThesisReview(today: Date): ThesisReview {
  const y = today.getFullYear();
  const candidates = [
    new Date(y, 0, 1),
    new Date(y, 6, 1),
    new Date(y + 1, 0, 1),
  ].filter((d) => d >= today);
  const next = candidates[0];
  const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
  return {
    label: next.toLocaleString("en-US", { month: "long", year: "numeric" }),
    daysUntil,
    isOverdue: daysUntil <= 0,
  };
}
