// ─── Insurance (canonical types live in types/insurance.ts) ──────────────────

import type { InsurancePolicy } from "./insurance";

export type {
  InsurancePolicyType,
  InsurancePolicy,
  EndowmentPolicy,
  HealthPolicy,
  UnitLinkPolicy,
  AccidentPolicy,
  AdHocTopUp,
  ULWithdrawal,
  EndowmentMetrics,
  EndowmentYearlyValue,
  YearlyPolicyValue,
  HealthScheduleRow,
} from "./insurance";

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

export interface CustomExpenseItem {
  id: string;
  label: string;
  monthlyAmount: number;
}

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
