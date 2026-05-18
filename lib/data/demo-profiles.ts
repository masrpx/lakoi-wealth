import type { AppState } from "@/types";
import type { EndowmentPolicy, HealthPolicy, UnitLinkPolicy } from "@/types/insurance";

// ─── Profile 1: พนักงานออฟฟิศ ─────────────────────────────────────────────────

const officeEndowment: EndowmentPolicy = {
  id: "p1-endowment",
  type: "endowment",
  name: "เมืองไทย สะสมทรัพย์ 15/15",
  startAge: 30,
  yearlyPremium: 30000,
  paymentPeriodYears: 15,
  coveragePeriodYears: 15,
  sumInsured: 600000,
  cashValueByYear: [
    12000,  26000,  42000,  60000,  80000,
   102000, 126000, 152000, 180000, 210000,
   242000, 276000, 312000, 350000, 600000,
  ],
  projectedMaturityValue: 680000,
};

const officeHealth: HealthPolicy = {
  id: "p1-health",
  type: "health",
  name: "AXA Health Premium",
  startAge: 30,
  endAge: 80,
  sumInsured: 2000000,
  yearlyPremiumByAge: {
    30: 12000, 35: 15000, 40: 20000, 45: 28000,
    50: 40000, 55: 58000, 60: 82000, 65: 115000,
    70: 160000, 75: 220000,
  },
};

export const officeWorkerProfile: AppState = {
  personal: { currentAge: 30, name: "คุณมินตรา สวัสดิ์ดี", monthlyIncome: 60000, monthlyExpense: 40000 },
  insurance: [officeEndowment, officeHealth],
  assets: [
    { id: "p1-a1", name: "เงินฝากออมทรัพย์",   category: "cash",       value: 120000  },
    { id: "p1-a2", name: "คอนโดลาดพร้าว",       category: "property",   value: 2800000 },
    { id: "p1-a3", name: "กองทุน SSF",           category: "investment", value: 80000   },
  ],
  liabilities: [
    { id: "p1-l1", name: "สินเชื่อคอนโด", category: "home_loan",     totalAmount: 2200000, monthlyPayment: 12000, interestRate: 3.0 },
    { id: "p1-l2", name: "บัตรเครดิต",   category: "credit_card",   totalAmount: 45000,   monthlyPayment: 2000,  interestRate: 18.0 },
  ],
  investments: [
    { id: "p1-i1", name: "K-CASH",           category: "fund", currentValue: 80000,  expectedReturn: 1.5, monthlyDCA: 2000 },
    { id: "p1-i2", name: "ONE-UGG-RA (US)",  category: "fund", currentValue: 40000,  expectedReturn: 9,   monthlyDCA: 3000 },
  ],
  goals: [
    { id: "p1-g1", type: "retirement", name: "เกษียณอายุ 60", targetAge: 60, targetAmount: 0, monthlyAmountAfter: 50000, inflationRate: 3 },
  ],
  cashflow: [],
  customExpenses: [],
};

// ─── Profile 2: เจ้าของธุรกิจ ─────────────────────────────────────────────────

const bizEndowment: EndowmentPolicy = {
  id: "p2-endowment",
  type: "endowment",
  name: "AIA Issara สะสมทรัพย์ 20/20",
  startAge: 42,
  yearlyPremium: 100000,
  paymentPeriodYears: 20,
  coveragePeriodYears: 20,
  sumInsured: 2500000,
  cashValueByYear: [
    45000, 95000, 150000, 210000, 275000,
    345000, 420000, 500000, 585000, 675000,
    770000, 870000, 975000, 1085000, 1200000,
    1320000, 1445000, 1575000, 1710000, 2500000,
  ],
  projectedMaturityValue: 2900000,
};

const bizHealth: HealthPolicy = {
  id: "p2-health",
  type: "health",
  name: "BDMS Health Premium",
  startAge: 42,
  endAge: 99,
  sumInsured: 10000000,
  yearlyPremiumByAge: {
    42: 52000, 45: 62000, 50: 88000, 55: 125000,
    60: 175000, 65: 245000, 70: 340000, 75: 475000,
  },
};

const bizUL: UnitLinkPolicy = {
  id: "p2-ul",
  type: "unit_link",
  name: "AIA Unit Link Wealth Plus",
  startAge: 42,
  regularYearlyPremium: 200000,
  paymentPeriodYears: 20,
  sumInsured: 10000000,
  initialTopUp: 500000,
  recurringTopUp: 100000,
  adHocTopUps: [{ year: 5, amount: 500000 }, { year: 10, amount: 1000000 }],
  expectedReturn: 8,
  costOfInsurance: 1.5,
  withdrawals: { startAge: 62, monthlyAmount: 100000 },
};

export const businessOwnerProfile: AppState = {
  personal: { currentAge: 42, name: "คุณวิชัย ธนากิจ", monthlyIncome: 300000, monthlyExpense: 150000 },
  insurance: [bizEndowment, bizHealth, bizUL],
  assets: [
    { id: "p2-a1", name: "เงินสดในมือ",           category: "cash",       value: 1500000  },
    { id: "p2-a2", name: "อาคารพาณิชย์สุขุมวิท",  category: "property",   value: 12000000 },
    { id: "p2-a3", name: "บ้านพักอาศัย",           category: "property",   value: 6500000  },
    { id: "p2-a4", name: "กองทุนรวมหุ้น",          category: "investment", value: 800000   },
    { id: "p2-a5", name: "ทองคำ 50 บาท",           category: "gold",       value: 500000   },
  ],
  liabilities: [
    { id: "p2-l1", name: "สินเชื่อธุรกิจ",    category: "other",          totalAmount: 5000000, monthlyPayment: 80000, interestRate: 5.5 },
    { id: "p2-l2", name: "สินเชื่อบ้านพัก",   category: "home_loan",      totalAmount: 3500000, monthlyPayment: 25000, interestRate: 3.0 },
  ],
  investments: [
    { id: "p2-i1", name: "TISCO SCI",          category: "fund", currentValue: 500000, expectedReturn: 7,   monthlyDCA: 20000 },
    { id: "p2-i2", name: "KFGBRAND-A",         category: "fund", currentValue: 300000, expectedReturn: 10,  monthlyDCA: 15000 },
    { id: "p2-i3", name: "K-FIXEDPLUS-A",      category: "fund", currentValue: 200000, expectedReturn: 4,   monthlyDCA: 5000  },
    { id: "p2-i4", name: "TMB-ES-GLOBAL-RMF",  category: "fund", currentValue: 400000, expectedReturn: 8,   monthlyDCA: 10000 },
  ],
  goals: [
    { id: "p2-g1", type: "retirement",   name: "เกษียณอายุ 62",         targetAge: 62, targetAmount: 0, monthlyAmountAfter: 150000, inflationRate: 3 },
    { id: "p2-g2", type: "education",    name: "ค่าเทอมลูกมหาวิทยาลัย", targetYear: 2033, targetAmount: 3000000 },
    { id: "p2-g3", type: "down_payment", name: "คอนโดลูกสาว",            targetYear: 2035, targetAmount: 2000000 },
  ],
  cashflow: [],
  customExpenses: [],
};

// ─── Profile 3: ใกล้เกษียณ ────────────────────────────────────────────────────

const preRetireHealth: HealthPolicy = {
  id: "p3-health",
  type: "health",
  name: "AXA Premium Health Executive",
  startAge: 55,
  endAge: 99,
  sumInsured: 5000000,
  yearlyPremiumByAge: {
    55: 95000, 60: 135000, 65: 190000,
    70: 265000, 75: 370000, 80: 520000,
  },
};

const preRetireEndowment: EndowmentPolicy = {
  id: "p3-endowment",
  type: "endowment",
  name: "เมืองไทย Life Bonus 10/5",
  startAge: 50,
  yearlyPremium: 120000,
  paymentPeriodYears: 5,
  coveragePeriodYears: 10,
  sumInsured: 700000,
  cashValueByYear: [
    80000, 175000, 280000, 390000, 600000,
    615000, 630000, 645000, 665000, 700000,
  ],
  projectedMaturityValue: 700000,
};

export const preRetireeProfile: AppState = {
  personal: { currentAge: 55, name: "คุณสุภา มั่งมีสุข", monthlyIncome: 120000, monthlyExpense: 60000 },
  insurance: [preRetireHealth, preRetireEndowment],
  assets: [
    { id: "p3-a1", name: "เงินฝากประจำ",         category: "cash",       value: 3000000  },
    { id: "p3-a2", name: "บ้านพักอาศัย",          category: "property",   value: 8000000  },
    { id: "p3-a3", name: "พอร์ตกองทุน",           category: "investment", value: 4500000  },
    { id: "p3-a4", name: "ทองคำ 100 บาท",         category: "gold",       value: 1000000  },
  ],
  liabilities: [
    { id: "p3-l1", name: "สินเชื่อบ้านคงเหลือ", category: "home_loan", totalAmount: 800000, monthlyPayment: 8000, interestRate: 2.5 },
  ],
  investments: [
    { id: "p3-i1", name: "TISCO SCI (หุ้นใหญ่)",     category: "fund", currentValue: 1200000, expectedReturn: 7,   monthlyDCA: 20000 },
    { id: "p3-i2", name: "KFAFIX (ตราสารหนี้)",       category: "fund", currentValue: 1500000, expectedReturn: 3.5, monthlyDCA: 15000 },
    { id: "p3-i3", name: "KFGBRAND-A (โลก)",          category: "fund", currentValue: 1000000, expectedReturn: 9,   monthlyDCA: 10000 },
    { id: "p3-i4", name: "K-CASH (สภาพคล่อง)",        category: "fund", currentValue: 800000,  expectedReturn: 1.5, monthlyDCA: 5000  },
  ],
  goals: [
    { id: "p3-g1", type: "retirement", name: "เกษียณอายุ 62",  targetAge: 62, targetAmount: 0, monthlyAmountAfter: 100000, inflationRate: 3 },
    { id: "p3-g2", type: "custom",     name: "มรดกให้ลูก",      targetAge: 80, targetAmount: 10000000 },
  ],
  cashflow: [],
  customExpenses: [],
};

// ─── Profile registry ─────────────────────────────────────────────────────────

export interface DemoProfile {
  id: string;
  label: string;
  subtitle: string;
  age: number;
  income: number;
  colorVar: string;
  state: AppState;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "office",
    label: "พนักงานออฟฟิศ",
    subtitle: "30 ปี · รายได้ 60,000/เดือน · เริ่มต้นสะสม",
    age: 30,
    income: 60000,
    colorVar: "var(--teal-500)",
    state: officeWorkerProfile,
  },
  {
    id: "biz",
    label: "เจ้าของธุรกิจ",
    subtitle: "42 ปี · รายได้ 300,000/เดือน · สร้างความมั่งคั่ง",
    age: 42,
    income: 300000,
    colorVar: "var(--gold-500)",
    state: businessOwnerProfile,
  },
  {
    id: "pre-retire",
    label: "ใกล้เกษียณ",
    subtitle: "55 ปี · รายได้ 120,000/เดือน · วางแผนส่งต่อ",
    age: 55,
    income: 120000,
    colorVar: "#a78bfa",
    state: preRetireeProfile,
  },
];
