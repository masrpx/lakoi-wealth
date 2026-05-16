// ─── Policy base ─────────────────────────────────────────────────────────────

export type InsurancePolicyType =
  | "endowment"
  | "whole_life"
  | "term"
  | "health"
  | "unit_link"
  | "accident";

interface InsurancePolicyBase {
  id: string;
  type: InsurancePolicyType;
  name: string;
  startAge: number;
}

// ─── Endowment / Whole Life / Term ───────────────────────────────────────────

export interface EndowmentPolicy extends InsurancePolicyBase {
  type: "endowment" | "whole_life" | "term";
  yearlyPremium: number;
  paymentPeriodYears: number;
  coveragePeriodYears: number;
  sumInsured: number;
  /** Year-by-year cash value from insurer illustration. index 0 = policy year 1. */
  cashValueByYear: number[];
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthPolicy extends InsurancePolicyBase {
  type: "health";
  endAge: number;
  /** Key = age, value = yearly premium for that age. Sparse — use fillHealthPremiumGrid before display. */
  yearlyPremiumByAge: Record<number, number>;
  sumInsured: number;
}

// ─── Unit Link ───────────────────────────────────────────────────────────────

export interface AdHocTopUp {
  /** Policy year (1-based) at which the lump sum is invested. */
  year: number;
  amount: number;
}

export interface ULWithdrawal {
  startAge: number;
  monthlyAmount: number;
}

export interface UnitLinkPolicy extends InsurancePolicyBase {
  type: "unit_link";
  regularYearlyPremium: number;
  paymentPeriodYears: number;
  sumInsured: number;
  initialTopUp: number;
  recurringTopUp: number;
  adHocTopUps: AdHocTopUp[];
  /** Decimal fraction, e.g. 0.06 = 6% per year. */
  expectedReturn: number;
  /** Decimal fraction, e.g. 0.005 = 0.5% of policy value per year. */
  costOfInsurance: number;
  withdrawals: ULWithdrawal | null;
}

// ─── Accident ─────────────────────────────────────────────────────────────────

export interface AccidentPolicy extends InsurancePolicyBase {
  type: "accident";
  yearlyPremium: number;
  coveragePeriodYears: number;
  accidentCoverage: number;
  medicalCoverage: number;
  disabilityCoverage: number;
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type InsurancePolicy =
  | EndowmentPolicy
  | HealthPolicy
  | UnitLinkPolicy
  | AccidentPolicy;

// ─── Calculation output types ─────────────────────────────────────────────────

export interface EndowmentMetrics {
  totalPaid: number;
  finalCashValue: number;
  /** Internal rate of return as a decimal (e.g. 0.034 = 3.4%). */
  irr: number;
}

export interface EndowmentYearlyValue {
  year: number;
  age: number;
  premiumPaid: number;
  cumulativePaid: number;
  cashValue: number;
  gain: number;
  /** True if the client's current age has already passed this policy year. */
  isPast: boolean;
}

export interface YearlyPolicyValue {
  year: number;
  age: number;
  premiumPaid: number;
  topUpPaid: number;
  growth: number;
  coiCharge: number;
  withdrawal: number;
  endValue: number;
}
