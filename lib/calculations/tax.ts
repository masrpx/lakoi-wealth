const BRACKETS = [
  { min: 0,           max: 150_000,   rate: 0    },
  { min: 150_000,     max: 300_000,   rate: 0.05 },
  { min: 300_000,     max: 500_000,   rate: 0.10 },
  { min: 500_000,     max: 750_000,   rate: 0.15 },
  { min: 750_000,     max: 1_000_000, rate: 0.20 },
  { min: 1_000_000,   max: 2_000_000, rate: 0.25 },
  { min: 2_000_000,   max: 5_000_000, rate: 0.30 },
  { min: 5_000_000,   max: Infinity,  rate: 0.35 },
];

export interface TaxBracketRow {
  rate: number;
  taxableInBracket: number;
  tax: number;
}

export interface TaxInput {
  annualIncome: number;
  lifeInsurancePremium: number;    // raw annual; capped at 100,000
  healthInsurancePremium: number;  // raw annual; capped at 25,000; combined life+health ≤ 100,000
  ssf: number;                     // SSF annual contribution
  rmf: number;                     // RMF annual contribution
}

export interface TaxResult {
  grossIncome: number;
  employmentDeduction: number;
  personalAllowance: number;
  lifeInsuranceDeduction: number;
  healthInsuranceDeduction: number;
  investmentDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  taxWithoutDeductions: number;
  taxWithDeductions: number;
  taxSaved: number;
  effectiveRate: number;
  brackets: TaxBracketRow[];
}

function calcTax(taxableIncome: number): { tax: number; brackets: TaxBracketRow[] } {
  let tax = 0;
  const brackets: TaxBracketRow[] = [];
  const income = Math.max(0, taxableIncome);

  for (const b of BRACKETS) {
    if (income <= b.min) break;
    const taxableInBracket = Math.min(income - b.min, b.max - b.min);
    const bracketTax = taxableInBracket * b.rate;
    tax += bracketTax;
    if (b.rate > 0) brackets.push({ rate: b.rate * 100, taxableInBracket, tax: bracketTax });
  }
  return { tax, brackets };
}

export function calcThai(input: TaxInput): TaxResult {
  const { annualIncome, lifeInsurancePremium, healthInsurancePremium, ssf, rmf } = input;

  // Standard deductions
  const employmentDeduction = Math.min(annualIncome * 0.5, 100_000);
  const personalAllowance = 60_000;

  // Insurance deductions (life ≤ 100k, health ≤ 25k, combined ≤ 100k)
  const lifeDeduction = Math.min(lifeInsurancePremium, 100_000);
  const healthDeduction = Math.min(healthInsurancePremium, 25_000, Math.max(0, 100_000 - lifeDeduction));
  const lifeInsuranceDeduction = lifeDeduction;
  const healthInsuranceDeduction = healthDeduction;

  // Investment deductions (SSF ≤ 30% income ≤ 200k; RMF ≤ 30% income ≤ 500k; combined retirement ≤ 500k)
  const ssfCap = Math.min(annualIncome * 0.30, 200_000);
  const rmfCap = Math.min(annualIncome * 0.30, 500_000);
  const investmentDeduction = Math.min(ssf, ssfCap) + Math.min(rmf, rmfCap);

  const baseDeductions = employmentDeduction + personalAllowance;
  const totalDeductions = baseDeductions + lifeInsuranceDeduction + healthInsuranceDeduction + investmentDeduction;

  const taxableNoExtra = Math.max(0, annualIncome - baseDeductions);
  const taxableWithAll = Math.max(0, annualIncome - totalDeductions);

  const { tax: taxWithout, brackets } = calcTax(taxableNoExtra);
  const { tax: taxWith } = calcTax(taxableWithAll);

  return {
    grossIncome: annualIncome,
    employmentDeduction,
    personalAllowance,
    lifeInsuranceDeduction,
    healthInsuranceDeduction,
    investmentDeduction,
    totalDeductions,
    taxableIncome: taxableWithAll,
    taxWithoutDeductions: taxWithout,
    taxWithDeductions: taxWith,
    taxSaved: taxWithout - taxWith,
    effectiveRate: annualIncome > 0 ? (taxWith / annualIncome) * 100 : 0,
    brackets,
  };
}
