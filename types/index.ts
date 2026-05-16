// ─── Insurance ───────────────────────────────────────────────────────────────

export interface InsurancePolicyBase {
  id: string;
  type: "endowment" | "whole_life" | "term" | "health" | "unit_link" | "accident";
  name: string;
  startAge: number;
}

export interface EndowmentPolicy extends InsurancePolicyBase {
  type: "endowment" | "whole_life" | "term";
  yearlyPremium: number;
  paymentPeriodYears: number;
  coveragePeriodYears: number;
  sumInsured: number;
  cashValueByYear: number[]; // index 0 = year 1
}

export interface HealthPolicy extends InsurancePolicyBase {
  type: "health";
  endAge: number;
  yearlyPremiumByAge: Record<number, number>; // { 35: 25000, 36: 27000, ... }
  sumInsured: number;
}

export interface UnitLinkPolicy extends InsurancePolicyBase {
  type: "unit_link";
  regularYearlyPremium: number;
  paymentPeriodYears: number;
  sumInsured: number;
  initialTopUp: number;
  recurringTopUp: number;
  adHocTopUps: { year: number; amount: number }[];
  expectedReturn: number; // % per year (e.g. 0.06 = 6%)
  costOfInsurance: number; // % of policy value
  withdrawals: {
    startAge: number;
    monthlyAmount: number;
  } | null;
}

export type InsurancePolicy = EndowmentPolicy | HealthPolicy | UnitLinkPolicy;

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type InvestmentCategory = "fund" | "stock" | "crypto" | "bond" | "reit" | "other";

export interface InvestmentItem {
  id: string;
  name: string;
  category: InvestmentCategory;
  currentValue: number;
  expectedReturn: number; // % per year
  monthlyDCA?: number;
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

export type AssetCategory = "cash" | "property" | "investment" | "gold" | "other";
export type LiabilityCategory = "home_loan" | "car_loan" | "personal_loan" | "credit_card" | "other";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  totalAmount: number;
  monthlyPayment: number;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalType = "retirement" | "education" | "down_payment" | "custom";

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAge?: number;
  targetYear?: number;
  targetAmount: number;
  monthlyAmountAfter?: number; // for retirement
  inflationRate?: number;
}

// ─── Cashflow ─────────────────────────────────────────────────────────────────

export interface CashflowEntry {
  id: string;
  label: string;
  type: "income" | "expense";
  monthlyAmount: number;
  startAge: number;
  endAge: number;
}

// ─── Scenario ────────────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  state: AppState;
}

// ─── App State (root) ────────────────────────────────────────────────────────

export interface PersonalInfo {
  currentAge: number;
  name: string;
}

export interface AppState {
  personal: PersonalInfo;
  insurance: InsurancePolicy[];
  assets: Asset[];
  liabilities: Liability[];
  investments: InvestmentItem[];
  goals: Goal[];
  cashflow: CashflowEntry[];
}

// ─── UI State ────────────────────────────────────────────────────────────────

export type AppMode = "agent" | "presentation";
export type CashflowView = "monthly" | "yearly";
