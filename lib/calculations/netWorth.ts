import type { InsurancePolicy, EndowmentPolicy, UnitLinkPolicy, AccidentPolicy } from "@/types/insurance";
import type { Asset, Liability, InvestmentItem } from "@/types";
import { yearlyPremiumForPolicy } from "./cashflow";
import { calculateUnitLinkProjection } from "./unit-link";
import { totalDeathBenefitAtAge } from "./endowment";

export interface NetWorthPoint {
  year: number;
  age: number;
  cash: number;
  property: number;
  investment: number;
  gold: number;
  insuranceCashValue: number;
  other: number;
  liabilities: number;          // stored as negative
  netWorth: number;
  totalDeathCoverage: number;   // sum of all active death benefits
}

export interface NetWorthProfile {
  currentAge: number;
  monthlyIncome: number;
  monthlyExpense: number;
  propertyGrowthRate: number;
  goldGrowthRate: number;
}

function insuranceCashValueAtAge(insurances: InsurancePolicy[], age: number): number {
  let total = 0;
  for (const policy of insurances) {
    if (policy.type === "endowment" || policy.type === "whole_life") {
      const p = policy as EndowmentPolicy;
      const policyYear = age - p.startAge;  // 0-indexed
      if (policyYear >= 0 && policyYear < p.coveragePeriodYears) {
        if (policyYear === p.coveragePeriodYears - 1 && p.projectedMaturityValue) {
          total += p.projectedMaturityValue;
        } else {
          total += p.cashValueByYear[policyYear] ?? 0;
        }
      }
    }
    if (policy.type === "unit_link") {
      const p = policy as UnitLinkPolicy;
      const policyYears = age - p.startAge + 1;
      if (policyYears >= 1) {
        const proj = calculateUnitLinkProjection(p, p.startAge, policyYears);
        total += proj[proj.length - 1]?.endValue ?? 0;
      }
    }
  }
  return total;
}

function deathCoverageAtAge(insurances: InsurancePolicy[], age: number): number {
  let total = 0;
  for (const policy of insurances) {
    if (policy.type === "endowment" || policy.type === "whole_life" || policy.type === "term") {
      const p = policy as EndowmentPolicy;
      if (age >= p.startAge && age < p.startAge + p.coveragePeriodYears) {
        total += totalDeathBenefitAtAge(p, age);
      }
    }
    if (policy.type === "unit_link") {
      const p = policy as UnitLinkPolicy;
      if (age >= p.startAge) {
        total += p.sumInsured;
      }
    }
    if (policy.type === "accident") {
      const p = policy as AccidentPolicy;
      const yr = age - p.startAge + 1;
      if (yr >= 1 && yr <= p.coveragePeriodYears) {
        total += p.accidentCoverage;
      }
    }
  }
  return total;
}

export function projectNetWorth(
  profile: NetWorthProfile,
  assets: Asset[],
  liabilities: Liability[],
  insurances: InsurancePolicy[],
  investments: InvestmentItem[],
  projectionYears = 30
): NetWorthPoint[] {
  // Starting asset values by category
  let cash = assets.filter((a) => a.category === "cash").reduce((s, a) => s + a.value, 0);
  let property = assets.filter((a) => a.category === "property").reduce((s, a) => s + a.value, 0);
  let gold = assets.filter((a) => a.category === "gold").reduce((s, a) => s + a.value, 0);
  const other = assets.filter((a) => a.category === "other").reduce((s, a) => s + a.value, 0);

  // Investment: balance sheet "investment" assets + tracked InvestmentItems
  const staticInvValue = assets.filter((a) => a.category === "investment").reduce((s, a) => s + a.value, 0);
  const dynamicInvValue = investments.reduce((s, inv) => s + inv.currentValue, 0);
  let investment = staticInvValue + dynamicInvValue;

  // Blended investment return (weighted average)
  const totalInvForWeighting = dynamicInvValue || 1;
  const blendedReturn =
    dynamicInvValue > 0
      ? investments.reduce((s, inv) => s + inv.currentValue * inv.expectedReturn, 0) / totalInvForWeighting
      : 7; // default 7% if no tracked investments

  const yearlyDCA = investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0) * 12, 0);
  const totalMonthlyDebt = liabilities.reduce((s, l) => s + l.monthlyPayment, 0);
  let liabValue = liabilities.reduce((s, l) => s + l.totalAmount, 0);

  const points: NetWorthPoint[] = [];

  for (let i = 0; i < projectionYears; i++) {
    const age = profile.currentAge + i;

    // Insurance premiums reduce net savings this year
    const premiums = insurances.reduce((s, p) => s + yearlyPremiumForPolicy(p, age), 0);
    const netSavings = profile.monthlyIncome * 12 - profile.monthlyExpense * 12 - premiums;

    // Apply growth
    cash = Math.max(0, cash + netSavings);
    property = property * (1 + profile.propertyGrowthRate / 100);
    investment = investment * (1 + blendedReturn / 100) + yearlyDCA;
    gold = gold * (1 + profile.goldGrowthRate / 100);
    liabValue = Math.max(0, liabValue - totalMonthlyDebt * 12);

    const insuranceCashValue = insuranceCashValueAtAge(insurances, age);
    const totalDeathCoverage = deathCoverageAtAge(insurances, age);
    const liabNegative = -liabValue;
    const netWorth = cash + property + investment + gold + insuranceCashValue + other + liabNegative;

    points.push({
      year: new Date().getFullYear() + i,
      age,
      cash,
      property,
      investment,
      gold,
      insuranceCashValue,
      other,
      liabilities: liabNegative,
      netWorth,
      totalDeathCoverage,
    });
  }

  return points;
}

export function findCrossoverAge(points: NetWorthPoint[]): number | null {
  const crossover = points.find((p) => p.netWorth >= p.totalDeathCoverage && p.totalDeathCoverage > 0);
  return crossover?.age ?? null;
}
