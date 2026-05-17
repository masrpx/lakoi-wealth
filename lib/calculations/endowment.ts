import type { EndowmentPolicy, EndowmentMetrics, EndowmentYearlyValue } from "@/types/insurance";

/**
 * Total death benefit at a given client age = base sumInsured + all active term riders at that age.
 * Returns a step-function value — flat unless term riders cause jumps.
 */
export function totalDeathBenefitAtAge(policy: EndowmentPolicy, age: number): number {
  const riders = policy.termRiders ?? [];
  const riderTotal = riders
    .filter((r) => age >= r.startAge && age < r.startAge + r.coverageYears)
    .reduce((sum, r) => sum + r.sumInsured, 0);
  return policy.sumInsured + riderTotal;
}

/**
 * Bisection method to find IRR — the rate where NPV of all cash flows = 0.
 * cashflows[t] = net cash flow at time t (negative = outflow, positive = inflow).
 */
function calculateIRR(cashflows: number[]): number {
  const npv = (rate: number) =>
    cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);

  // Edge case: all outflows → IRR is undefined, return 0
  const hasInflow = cashflows.some((cf) => cf > 0);
  if (!hasInflow) return 0;

  let lo = -0.99;
  let hi = 5.0; // 500% — wide enough for any real policy
  if (npv(lo) < 0 || npv(hi) > 0) return 0; // no sign change, bail

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Aggregate metrics for an endowment / whole-life / term policy.
 * Cash value is taken from the insurer's illustration table (user-input) —
 * no growth modelling here, just reading the table.
 */
export function calculateEndowmentMetrics(policy: EndowmentPolicy): EndowmentMetrics {
  const { yearlyPremium, paymentPeriodYears, coveragePeriodYears, cashValueByYear } = policy;

  const totalPaid = yearlyPremium * paymentPeriodYears;
  const finalCashValue =
    cashValueByYear[coveragePeriodYears - 1] ??
    cashValueByYear[cashValueByYear.length - 1] ??
    0;

  // Build cashflow array (index = year, 0-based from policy inception)
  // Premiums paid at start of each year: year 0 → year (n-1)
  // Maturity proceeds received at end of coverage period
  const totalYears = Math.max(paymentPeriodYears, coveragePeriodYears);
  const cashflows: number[] = Array(totalYears + 1).fill(0);

  for (let y = 0; y < paymentPeriodYears; y++) {
    cashflows[y] -= yearlyPremium;
  }
  cashflows[coveragePeriodYears] += finalCashValue;

  const irr = calculateIRR(cashflows);

  // Projected metrics — only when agent has provided a projected total
  if (policy.projectedMaturityValue !== undefined) {
    const projectedCashflows = [...cashflows];
    projectedCashflows[coveragePeriodYears] =
      projectedCashflows[coveragePeriodYears] - finalCashValue + policy.projectedMaturityValue;

    return {
      totalPaid,
      finalCashValue,
      irr,
      projectedMaturityValue: policy.projectedMaturityValue,
      projectedIRR: calculateIRR(projectedCashflows),
      projectedGain: policy.projectedMaturityValue - totalPaid,
    };
  }

  return { totalPaid, finalCashValue, irr };
}

/**
 * Year-by-year breakdown of an endowment / whole-life / term policy.
 * currentAge is used to flag years that have already passed.
 */
export function calculateEndowmentTimeline(
  policy: EndowmentPolicy,
  currentAge: number
): EndowmentYearlyValue[] {
  const { startAge, yearlyPremium, paymentPeriodYears, coveragePeriodYears, cashValueByYear } =
    policy;

  const rows: EndowmentYearlyValue[] = [];
  let cumulativePaid = 0;

  for (let year = 1; year <= coveragePeriodYears; year++) {
    const age = startAge + year - 1;
    const premiumPaid = year <= paymentPeriodYears ? yearlyPremium : 0;
    cumulativePaid += premiumPaid;
    const cashValue = cashValueByYear[year - 1] ?? 0;
    const gain = cashValue - cumulativePaid;

    rows.push({
      year,
      age,
      premiumPaid,
      cumulativePaid,
      cashValue,
      gain,
      isPast: currentAge > age,
      projectedValue:
        year === coveragePeriodYears ? policy.projectedMaturityValue : undefined,
    });
  }

  return rows;
}
