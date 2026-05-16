import type { AppState } from "@/types";
import type { EndowmentPolicy, HealthPolicy, UnitLinkPolicy } from "@/types/insurance";

// ─── Individual fixtures ──────────────────────────────────────────────────────
// Named exports so calculation tests can import them directly without the
// full AppState wrapper.

export const DEMO_ENDOWMENT: EndowmentPolicy = {
  id: "demo-endowment-1",
  type: "endowment",
  name: "ไทยประกัน เอนดาวเม้นท์ 20",
  startAge: 35,
  yearlyPremium: 80000,
  paymentPeriodYears: 20,
  coveragePeriodYears: 20,
  sumInsured: 1000000,
  cashValueByYear: [
    16000,   33000,  51000,  70000,   90000,
    112000, 135000, 160000, 186000,  214000,
    244000, 276000, 310000, 346000,  385000,
    427000, 472000, 520000, 572000, 1200000,
  ],
};

export const DEMO_HEALTH: HealthPolicy = {
  id: "demo-health-1",
  type: "health",
  name: "เมืองไทย เฮลท์ พลัส",
  startAge: 35,
  endAge: 70,
  sumInsured: 3000000,
  // Sparse inputs — agent fills band starts; fillHealthPremiumGrid interpolates gaps
  yearlyPremiumByAge: Object.fromEntries(
    Array.from({ length: 36 }, (_, i) => {
      const age = 35 + i;
      const base =
        age < 40 ? 25000 :
        age < 45 ? 32000 :
        age < 50 ? 41000 :
        age < 55 ? 54000 :
        age < 60 ? 72000 :
        age < 65 ? 95000 : 120000;
      return [age, base];
    })
  ),
};

export const DEMO_UL: UnitLinkPolicy = {
  id: "demo-ul-1",
  type: "unit_link",
  name: "AIA Unit Link",
  startAge: 35,
  regularYearlyPremium: 120000,
  paymentPeriodYears: 25,
  sumInsured: 2000000,
  initialTopUp: 500000,
  recurringTopUp: 50000,
  adHocTopUps: [
    { year: 5,  amount: 200000 },
    { year: 10, amount: 300000 },
  ],
  expectedReturn: 0.06,    // 6% per year
  costOfInsurance: 0.005,  // 0.5% of policy value per year
  withdrawals: {
    startAge: 60,
    monthlyAmount: 30000,
  },
};

// ─── Full demo client ─────────────────────────────────────────────────────────

export const demoData: AppState = {
  personal: {
    currentAge: 35,
    name: "คุณสมชาย ใจดี",
  },
  insurance: [DEMO_ENDOWMENT, DEMO_HEALTH, DEMO_UL],
  assets: [
    { id: "a1", name: "เงินฝากออมทรัพย์", category: "cash", value: 500000 },
    { id: "a2", name: "บ้านพักอาศัย", category: "property", value: 4500000 },
    { id: "a3", name: "กองทุน RMF", category: "investment", value: 350000 },
    { id: "a4", name: "ทองคำ", category: "gold", value: 200000 },
  ],
  liabilities: [
    {
      id: "l1",
      name: "สินเชื่อบ้าน",
      category: "home_loan",
      totalAmount: 2800000,
      monthlyPayment: 15000,
    },
    {
      id: "l2",
      name: "สินเชื่อรถยนต์",
      category: "car_loan",
      totalAmount: 350000,
      monthlyPayment: 8500,
    },
  ],
  investments: [
    {
      id: "i1",
      name: "กองทุน SET50",
      category: "fund",
      currentValue: 250000,
      expectedReturn: 0.08,
      monthlyDCA: 5000,
    },
    {
      id: "i2",
      name: "กองทุน Global Equity",
      category: "fund",
      currentValue: 180000,
      expectedReturn: 0.1,
      monthlyDCA: 3000,
    },
  ],
  goals: [
    {
      id: "g1",
      type: "retirement",
      name: "เกษียณอายุ 60",
      targetAge: 60,
      targetAmount: 10000000,
      monthlyAmountAfter: 50000,
      inflationRate: 0.03,
    },
    {
      id: "g2",
      type: "education",
      name: "ค่าเล่าเรียนบุตร",
      targetYear: 2036,
      targetAmount: 2000000,
    },
  ],
  cashflow: [
    {
      id: "cf1",
      label: "รายได้เงินเดือน",
      type: "income",
      monthlyAmount: 80000,
      startAge: 35,
      endAge: 60,
    },
    {
      id: "cf2",
      label: "ค่าใช้จ่ายครัวเรือน",
      type: "expense",
      monthlyAmount: 40000,
      startAge: 35,
      endAge: 90,
    },
  ],
};
