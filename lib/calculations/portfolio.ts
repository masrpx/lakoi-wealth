import type { InvestmentItem, InvestmentCategory } from "@/types";

export const CAT_COLORS: Record<InvestmentCategory, string> = {
  fund:   "#60a5fa",
  stock:  "#2dd4bf",
  bond:   "#a78bfa",
  reit:   "#f59e0b",
  crypto: "#fb7185",
  other:  "#94a3b8",
};

export const CAT_LABELS: Record<InvestmentCategory, string> = {
  fund:   "กองทุน",
  stock:  "หุ้น",
  bond:   "ตราสารหนี้",
  reit:   "อสังหาฯ REIT",
  crypto: "คริปโต",
  other:  "อื่น ๆ",
};

export interface AllocationItem {
  category: InvestmentCategory;
  label: string;
  value: number;
  pct: number;
  color: string;
}

export function portfolioAllocation(investments: InvestmentItem[]): AllocationItem[] {
  const total = investments.reduce((s, inv) => s + inv.currentValue, 0) || 1;
  const byCategory = new Map<InvestmentCategory, number>();
  for (const inv of investments) {
    byCategory.set(inv.category, (byCategory.get(inv.category) ?? 0) + inv.currentValue);
  }
  return Array.from(byCategory.entries())
    .map(([category, value]) => ({
      category,
      label: CAT_LABELS[category],
      value,
      pct: (value / total) * 100,
      color: CAT_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);
}

export function portfolioWeightedReturn(investments: InvestmentItem[]): number {
  const total = investments.reduce((s, inv) => s + inv.currentValue, 0);
  if (total === 0) return 7;
  return investments.reduce((s, inv) => s + inv.currentValue * inv.expectedReturn, 0) / total;
}

export function portfolioTotalValue(investments: InvestmentItem[]): number {
  return investments.reduce((s, inv) => s + inv.currentValue, 0);
}

export function portfolioTotalDCA(investments: InvestmentItem[]): number {
  return investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0), 0);
}

export interface ProjectionPoint {
  year: number;
  age: number;
  value: number;
}

export function projectPortfolioValue(
  investments: InvestmentItem[],
  currentAge: number,
  years: number,
  extraMonthlyDCA = 0
): ProjectionPoint[] {
  const pv = portfolioTotalValue(investments);
  const r = portfolioWeightedReturn(investments);
  const dca = portfolioTotalDCA(investments) + extraMonthlyDCA;
  const r_m = r / 1200;

  return Array.from({ length: years }, (_, i) => {
    const n = (i + 1) * 12;
    const fv_pv = pv * Math.pow(1 + r_m, n);
    const fv_dca = r_m > 0 ? dca * (Math.pow(1 + r_m, n) - 1) / r_m : dca * n;
    return {
      year: new Date().getFullYear() + i + 1,
      age: currentAge + i + 1,
      value: fv_pv + fv_dca,
    };
  });
}
