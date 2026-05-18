import type { AppState, Goal } from "@/types";
import { projectNetWorth } from "./netWorth";
import { yearlyPremiumForPolicy } from "./cashflow";

export interface ScenarioMetrics {
  retirementAge: number;
  netWorthAtRetirement: number;
  totalYearlyPremium: number;
  /** Positive = surplus monthly income from net worth at 4% SWR vs target. Negative = gap. */
  retirementGapMonthly: number;
  currentNetWorth: number;
}

function retirementGoal(goals: Goal[]): Goal | undefined {
  return goals.find((g) => g.type === "retirement");
}

export function computeScenarioMetrics(state: AppState): ScenarioMetrics {
  const currentAge = state.personal.currentAge || 35;
  const goal = retirementGoal(state.goals);
  const retirementAge = goal?.targetAge ?? 60;
  const projYears = Math.max(1, retirementAge - currentAge + 1);

  const points = projectNetWorth(
    {
      currentAge,
      monthlyIncome: state.personal.monthlyIncome || 0,
      monthlyExpense: state.personal.monthlyExpense || 0,
      propertyGrowthRate: 3,
      goldGrowthRate: 0,
    },
    state.assets,
    state.liabilities,
    state.insurance,
    state.investments,
    projYears
  );

  const currentNetWorth = points[0]?.netWorth ?? 0;
  const netWorthAtRetirement = points[points.length - 1]?.netWorth ?? 0;

  const totalYearlyPremium = state.insurance.reduce(
    (s, p) => s + yearlyPremiumForPolicy(p, currentAge),
    0
  );

  const sustainableMonthly = (netWorthAtRetirement * 0.04) / 12;
  const neededMonthly = goal?.monthlyAmountAfter ?? 0;
  const retirementGapMonthly = sustainableMonthly - neededMonthly;

  return {
    retirementAge,
    netWorthAtRetirement,
    totalYearlyPremium,
    retirementGapMonthly,
    currentNetWorth,
  };
}

export function buildNetWorthSeries(
  state: AppState,
  projYears = 30
): Array<{ age: number; netWorth: number }> {
  const currentAge = state.personal.currentAge || 35;
  const points = projectNetWorth(
    {
      currentAge,
      monthlyIncome: state.personal.monthlyIncome || 0,
      monthlyExpense: state.personal.monthlyExpense || 0,
      propertyGrowthRate: 3,
      goldGrowthRate: 0,
    },
    state.assets,
    state.liabilities,
    state.insurance,
    state.investments,
    projYears
  );
  return points.map((p) => ({ age: p.age, netWorth: p.netWorth }));
}
