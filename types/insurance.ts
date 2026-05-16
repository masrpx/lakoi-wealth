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
  /** Guaranteed year-by-year cash value from insurer illustration. index 0 = policy year 1. */
  cashValueByYear: number[];
  /** Total projected payout at maturity including non-guaranteed dividends. User inputs from insurer's projected scenario. */
  projectedMaturityValue?: number;
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
  /** Whole percentage, e.g. 7 = 7% per year. */
  expectedReturn: number;
  /** Whole percentage, e.g. 1.5 = 1.5% of policy value per year. */
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
  /** Guaranteed cash value at maturity (from cashValueByYear table). */
  finalCashValue: number;
  /** IRR based on guaranteed cash value only. Decimal, e.g. 0.034 = 3.4%. */
  irr: number;
  /** User-supplied projected total (guaranteed + dividends). Undefined if not set. */
  projectedMaturityValue?: number;
  /** IRR based on projected total maturity value. Undefined if projectedMaturityValue not set. */
  projectedIRR?: number;
  /** projectedMaturityValue - totalPaid. Undefined if projectedMaturityValue not set. */
  projectedGain?: number;
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
  /** Projected total payout — only populated on the final year row. */
  projectedValue?: number;
}

export interface HealthScheduleRow {
  age: number;
  premium: number;
  cumulativePaid: number;
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
