import type { AppState } from "@/types";
import type { EndowmentPolicy, HealthPolicy, UnitLinkPolicy } from "@/types/insurance";

// ─── Individual fixtures (match CLAUDE.md DEMO_CLIENT exactly) ───────────────

export const DEMO_ENDOWMENT: EndowmentPolicy = {
  id: "demo-endowment-1",
  type: "endowment",
  name: "AIA Issara สะสมทรัพย์ 20/20",
  startAge: 35,
  yearlyPremium: 50000,
  paymentPeriodYears: 20,
  coveragePeriodYears: 20,
  sumInsured: 1200000,
  // Guaranteed cash value from insurer illustration (50k/yr × 20yr = 1M paid, 1.2M guaranteed at maturity)
  cashValueByYear: [
     22000,  46000,  72000, 100000, 130000,
    162000, 196000, 232000, 270000, 310000,
    352000, 396000, 442000, 490000, 540000,
    592000, 646000, 702000, 760000, 1200000,
  ],
  // Projected total including non-guaranteed dividends (from insurer's moderate scenario)
  projectedMaturityValue: 1380000,
};

export const DEMO_HEALTH: HealthPolicy = {
  id: "demo-health-1",
  type: "health",
  name: "BDMS Health Lump Sum",
  startAge: 35,
  endAge: 99,
  sumInsured: 5000000,
  // Sparse checkpoints — agent fills these from insurer rate table; fillHealthPremiumGrid interpolates gaps
  yearlyPremiumByAge: {
     36:  22000,
     41:  28000,
     46:  38000,
     51:  52000,
     56:  72000,
     61: 100000,
     66: 140000,
     71: 195000,
     76: 270000,
     81: 380000,
  },
};

export const DEMO_UL: UnitLinkPolicy = {
  id: "demo-ul-1",
  type: "unit_link",
  name: "AIA Unit Link Smart",
  startAge: 35,
  regularYearlyPremium: 100000,
  paymentPeriodYears: 25,
  sumInsured: 5000000,
  initialTopUp: 200000,
  recurringTopUp: 50000,
  adHocTopUps: [
    { year: 10, amount: 300000 },
  ],
  expectedReturn: 7,    // 7% per year (whole percentage)
  costOfInsurance: 1.5, // 1.5% of policy value per year (whole percentage)
  withdrawals: {
    startAge: 60,
    monthlyAmount: 30000,
  },
};

// ─── Full demo client (CLAUDE.md DEMO_CLIENT) ─────────────────────────────────

export const demoData: AppState = {
  personal: {
    currentAge: 35,
    name: "คุณสมชาย ใจดี",
  },
  insurance: [DEMO_ENDOWMENT, DEMO_HEALTH, DEMO_UL],
  assets: [
    { id: "a1", name: "เงินฝาก",           category: "cash",       value: 500000  },
    { id: "a2", name: "คอนโดเดอะลอฟท์",   category: "property",   value: 4500000 },
    { id: "a3", name: "กองทุน LTF เดิม",   category: "investment", value: 200000  },
    { id: "a4", name: "ทองคำ",             category: "gold",       value: 150000  },
  ],
  liabilities: [
    {
      id: "l1",
      name: "สินเชื่อบ้าน",
      category: "home_loan",
      totalAmount: 2800000,
      monthlyPayment: 18000,
    },
    {
      id: "l2",
      name: "ผ่อนรถ",
      category: "car_loan",
      totalAmount: 350000,
      monthlyPayment: 8500,
    },
  ],
  investments: [
    { id: "i1", name: "K-CASH",                  category: "fund", currentValue: 300000, expectedReturn: 1.5, monthlyDCA: 5000  },
    { id: "i2", name: "TMBGQG (Global Equity)",  category: "fund", currentValue: 200000, expectedReturn: 9,   monthlyDCA: 10000 },
    { id: "i3", name: "ASP-DIVM (Thai Equity)",  category: "fund", currentValue: 150000, expectedReturn: 7,   monthlyDCA: 5000  },
    { id: "i4", name: "KFSMART (Mixed)",          category: "fund", currentValue: 100000, expectedReturn: 6,   monthlyDCA: 3000  },
  ],
  goals: [
    {
      id: "g1",
      type: "retirement",
      name: "เกษียณอายุ 60",
      targetAge: 60,
      targetAmount: 0, // derived from monthlyAmountAfter
      monthlyAmountAfter: 80000,
      inflationRate: 3,
    },
    {
      id: "g2",
      type: "education",
      name: "ค่าเทอมลูกมหาลัย",
      targetYear: 2042,
      targetAmount: 2000000,
    },
  ],
  cashflow: [
    {
      id: "cf1",
      label: "รายได้เงินเดือน",
      type: "income",
      monthlyAmount: 150000,
      startAge: 35,
      endAge: 60,
    },
    {
      id: "cf2",
      label: "ค่าใช้จ่ายครัวเรือน",
      type: "expense",
      monthlyAmount: 80000,
      startAge: 35,
      endAge: 90,
    },
  ],
};
