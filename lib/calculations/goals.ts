import type { Goal } from "@/types";

export interface GoalResult {
  goalId: string;
  name: string;
  type: string;
  corpusNeeded: number;
  currentTrajectory: number;
  shortfall: number;             // positive = deficit, negative = surplus
  requiredMonthlySavings: number;
  isOnTrack: boolean;
  percentProgress: number;       // 0–100
  yearsToTarget: number;
  targetAge?: number;
  targetYear?: number;
}

function fvWithDCA(pv: number, r_m: number, n_months: number, dca: number): number {
  const growth = Math.pow(1 + r_m, n_months);
  const fv_pv = pv * growth;
  const fv_dca = r_m > 0 ? dca * (growth - 1) / r_m : dca * n_months;
  return fv_pv + fv_dca;
}

function pmtToReach(gap: number, r_m: number, n_months: number): number {
  if (gap <= 0) return 0;
  if (r_m === 0 || n_months === 0) return n_months > 0 ? gap / n_months : 0;
  return gap * r_m / (Math.pow(1 + r_m, n_months) - 1);
}

export function calcGoalResult(
  goal: Goal,
  currentAge: number,
  currentYear: number,
  currentPortfolioValue: number,
  blendedReturn: number,
  totalMonthlyDCA: number
): GoalResult {
  const r_m = blendedReturn / 1200;

  // Determine years to target
  let yearsToTarget = 0;
  let targetAge: number | undefined;
  let targetYear: number | undefined;

  if (goal.targetAge) {
    yearsToTarget = Math.max(0, goal.targetAge - currentAge);
    targetAge = goal.targetAge;
  } else if (goal.targetYear) {
    yearsToTarget = Math.max(0, goal.targetYear - currentYear);
    targetYear = goal.targetYear;
    targetAge = currentAge + yearsToTarget;
  }

  const n = yearsToTarget * 12;

  // Corpus calculation
  let corpusNeeded = 0;
  if (goal.type === "retirement") {
    const inflationRate = (goal.inflationRate ?? 3) / 100;
    const monthlyNeedFuture = (goal.monthlyAmountAfter ?? 0) * Math.pow(1 + inflationRate, yearsToTarget);
    corpusNeeded = monthlyNeedFuture * 12 / 0.04;
  } else {
    corpusNeeded = goal.targetAmount;
  }

  const currentTrajectory = fvWithDCA(currentPortfolioValue, r_m, n, totalMonthlyDCA);
  const shortfall = corpusNeeded - currentTrajectory;
  const requiredMonthlySavings = pmtToReach(shortfall, r_m, n);
  const isOnTrack = currentTrajectory >= corpusNeeded;
  const percentProgress = corpusNeeded > 0
    ? Math.min(100, (currentTrajectory / corpusNeeded) * 100)
    : 100;

  return {
    goalId: goal.id,
    name: goal.name,
    type: goal.type,
    corpusNeeded,
    currentTrajectory,
    shortfall,
    requiredMonthlySavings,
    isOnTrack,
    percentProgress,
    yearsToTarget,
    targetAge,
    targetYear,
  };
}
