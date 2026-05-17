import type {
  InsurancePolicy,
  EndowmentPolicy,
  HealthPolicy,
  UnitLinkPolicy,
  AccidentPolicy,
} from "@/types/insurance";
import type { InvestmentItem, Liability, CustomExpenseItem } from "@/types";

export interface CashflowProfile {
  currentAge: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface CashflowMonthPoint {
  month: number;
  label: string;
  income: number;
  livingExpense: number;       // stored positive, negate in chart
  insurancePremium: number;    // stored positive, negate in chart
  investmentDCA: number;       // stored positive, negate in chart
  net: number;
  cumulative: number;
}

export interface PolicyReturnItem {
  policyName: string;
  amount: number;
}

export interface CashflowYearPoint {
  year: number;
  age: number;
  income: number;
  livingExpense: number;       // stored positive
  insurancePremium: number;    // stored positive
  investmentDCA: number;       // stored positive
  policyReturns: number;       // positive: endowment maturity, UL withdrawals
  returnItems: PolicyReturnItem[];
  net: number;
  cumulative: number;
}

// ── V2 types — include debt payments and custom expenses ──────────────────────

export interface CashflowBreakdownInput {
  profile: CashflowProfile;
  insurances: InsurancePolicy[];
  investments: InvestmentItem[];
  liabilities: Liability[];
  customExpenses: CustomExpenseItem[];
}

export interface CashflowMonthPointV2 extends CashflowMonthPoint {
  debtPayment: number;
  customExpenseTotal: number;
}

export interface CashflowYearPointV2 extends CashflowYearPoint {
  debtPayment: number;
  customExpenseTotal: number;
}

// ─────────────────────────────────────────────────────────────────────────────

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function healthStepPremium(policy: HealthPolicy, age: number): number {
  if (age < policy.startAge || age > policy.endAge) return 0;
  const keys = Object.keys(policy.yearlyPremiumByAge).map(Number).sort((a, b) => a - b);
  const cp = [...keys].reverse().find((k) => k <= age);
  return cp !== undefined ? policy.yearlyPremiumByAge[cp] : 0;
}

export function yearlyPremiumForPolicy(policy: InsurancePolicy, age: number): number {
  switch (policy.type) {
    case "endowment":
    case "whole_life":
    case "term": {
      const p = policy as EndowmentPolicy;
      const yr = age - p.startAge + 1;
      return yr >= 1 && yr <= p.paymentPeriodYears ? p.yearlyPremium : 0;
    }
    case "health":
      return healthStepPremium(policy as HealthPolicy, age);
    case "unit_link": {
      const p = policy as UnitLinkPolicy;
      const yr = age - p.startAge + 1;
      if (yr < 1 || yr > p.paymentPeriodYears) return 0;
      const initial = yr === 1 ? p.initialTopUp : 0;
      const adHoc = p.adHocTopUps.find((t) => t.year === yr)?.amount ?? 0;
      return p.regularYearlyPremium + p.recurringTopUp + initial + adHoc;
    }
    case "accident": {
      const p = policy as AccidentPolicy;
      const yr = age - p.startAge + 1;
      return yr >= 1 && yr <= p.coveragePeriodYears ? p.yearlyPremium : 0;
    }
  }
}

export function aggregateMonthlyCashflow(
  profile: CashflowProfile,
  insurances: InsurancePolicy[],
  investments: InvestmentItem[]
): CashflowMonthPoint[] {
  const yearlyPremium = insurances.reduce(
    (s, p) => s + yearlyPremiumForPolicy(p, profile.currentAge),
    0
  );
  const monthlyPremium = yearlyPremium / 12;
  const monthlyDCA = investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0), 0);

  let cumulative = 0;
  return THAI_MONTHS.map((label, i) => {
    const net = profile.monthlyIncome - profile.monthlyExpense - monthlyPremium - monthlyDCA;
    cumulative += net;
    return {
      month: i + 1,
      label,
      income: profile.monthlyIncome,
      livingExpense: profile.monthlyExpense,
      insurancePremium: monthlyPremium,
      investmentDCA: monthlyDCA,
      net,
      cumulative,
    };
  });
}

export function aggregateYearlyCashflow(
  profile: CashflowProfile,
  insurances: InsurancePolicy[],
  investments: InvestmentItem[],
  projectionYears = 30
): CashflowYearPoint[] {
  const baseIncome = profile.monthlyIncome * 12;
  const baseExpense = profile.monthlyExpense * 12;
  const yearlyDCA = investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0) * 12, 0);

  let cumulative = 0;
  return Array.from({ length: projectionYears }, (_, i) => {
    const age = profile.currentAge + i;

    const insurancePremium = insurances.reduce(
      (s, p) => s + yearlyPremiumForPolicy(p, age),
      0
    );

    const returnItems: PolicyReturnItem[] = [];
    for (const policy of insurances) {
      if (policy.type === "endowment" || policy.type === "whole_life") {
        const p = policy as EndowmentPolicy;
        const maturityAge = p.startAge + p.coveragePeriodYears - 1;
        if (age === maturityAge) {
          const amount =
            p.projectedMaturityValue ??
            p.cashValueByYear[p.coveragePeriodYears - 1] ??
            p.sumInsured;
          returnItems.push({ policyName: p.name, amount });
        }
      }
      if (policy.type === "unit_link") {
        const p = policy as UnitLinkPolicy;
        if (p.withdrawals && age >= p.withdrawals.startAge) {
          returnItems.push({
            policyName: p.name,
            amount: p.withdrawals.monthlyAmount * 12,
          });
        }
      }
    }

    const policyReturns = returnItems.reduce((s, r) => s + r.amount, 0);
    const net = baseIncome + policyReturns - baseExpense - insurancePremium - yearlyDCA;
    cumulative += net;

    return {
      year: new Date().getFullYear() + i,
      age,
      income: baseIncome,
      livingExpense: baseExpense,
      insurancePremium,
      investmentDCA: yearlyDCA,
      policyReturns,
      returnItems,
      net,
      cumulative,
    };
  });
}

// ── V2 functions — same as above but include debt payments + custom expenses ──

export function aggregateMonthlyCashflowV2(
  input: CashflowBreakdownInput
): CashflowMonthPointV2[] {
  const { profile, insurances, investments, liabilities, customExpenses } = input;

  const yearlyPremium = insurances.reduce(
    (s, p) => s + yearlyPremiumForPolicy(p, profile.currentAge),
    0
  );
  const monthlyPremium = yearlyPremium / 12;
  const monthlyDCA = investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0), 0);
  const debtPayment = liabilities.reduce((s, l) => s + l.monthlyPayment, 0);
  const customExpenseTotal = customExpenses.reduce((s, e) => s + e.monthlyAmount, 0);

  let cumulative = 0;
  return THAI_MONTHS.map((label, i) => {
    const net =
      profile.monthlyIncome -
      profile.monthlyExpense -
      monthlyPremium -
      monthlyDCA -
      debtPayment -
      customExpenseTotal;
    cumulative += net;
    return {
      month: i + 1,
      label,
      income: profile.monthlyIncome,
      livingExpense: profile.monthlyExpense,
      insurancePremium: monthlyPremium,
      investmentDCA: monthlyDCA,
      net,
      cumulative,
      debtPayment,
      customExpenseTotal,
    };
  });
}

export function aggregateYearlyCashflowV2(
  input: CashflowBreakdownInput,
  projectionYears = 30
): CashflowYearPointV2[] {
  const { profile, insurances, investments, liabilities, customExpenses } = input;

  const baseIncome = profile.monthlyIncome * 12;
  const baseExpense = profile.monthlyExpense * 12;
  const yearlyDCA = investments.reduce((s, inv) => s + (inv.monthlyDCA ?? 0) * 12, 0);
  const yearlyDebt = liabilities.reduce((s, l) => s + l.monthlyPayment * 12, 0);
  const yearlyCustom = customExpenses.reduce((s, e) => s + e.monthlyAmount * 12, 0);

  let cumulative = 0;
  return Array.from({ length: projectionYears }, (_, i) => {
    const age = profile.currentAge + i;

    const insurancePremium = insurances.reduce(
      (s, p) => s + yearlyPremiumForPolicy(p, age),
      0
    );

    const returnItems: PolicyReturnItem[] = [];
    for (const policy of insurances) {
      if (policy.type === "endowment" || policy.type === "whole_life") {
        const p = policy as EndowmentPolicy;
        const maturityAge = p.startAge + p.coveragePeriodYears - 1;
        if (age === maturityAge) {
          const amount =
            p.projectedMaturityValue ??
            p.cashValueByYear[p.coveragePeriodYears - 1] ??
            p.sumInsured;
          returnItems.push({ policyName: p.name, amount });
        }
      }
      if (policy.type === "unit_link") {
        const p = policy as UnitLinkPolicy;
        if (p.withdrawals && age >= p.withdrawals.startAge) {
          returnItems.push({
            policyName: p.name,
            amount: p.withdrawals.monthlyAmount * 12,
          });
        }
      }
    }

    const policyReturns = returnItems.reduce((s, r) => s + r.amount, 0);
    const net =
      baseIncome +
      policyReturns -
      baseExpense -
      insurancePremium -
      yearlyDCA -
      yearlyDebt -
      yearlyCustom;
    cumulative += net;

    return {
      year: new Date().getFullYear() + i,
      age,
      income: baseIncome,
      livingExpense: baseExpense,
      insurancePremium,
      investmentDCA: yearlyDCA,
      policyReturns,
      returnItems,
      net,
      cumulative,
      debtPayment: yearlyDebt,
      customExpenseTotal: yearlyCustom,
    };
  });
}
