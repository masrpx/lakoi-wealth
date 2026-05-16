import type { UnitLinkPolicy, YearlyPolicyValue } from "@/types/insurance";

/**
 * Projects a Unit Link policy value year-by-year.
 *
 * Formula per year (from PRD §12):
 *   startValue  = prevEndValue + premiumPaid + topUpPaid
 *   growth      = startValue × (expectedReturn / 100)
 *   coiCharge   = startValue × (costOfInsurance / 100)
 *   withdrawal  = monthlyAmount × 12  (if client age ≥ withdrawals.startAge)
 *   endValue    = startValue + growth − coiCharge − withdrawal
 *
 * @param policy         The UL policy object
 * @param currentAge     Client's current age (used to track "past" years)
 * @param projectionYears How many policy years to project (default: 40)
 */
export function calculateUnitLinkProjection(
  policy: UnitLinkPolicy,
  currentAge: number,
  projectionYears = 40
): YearlyPolicyValue[] {
  const {
    startAge,
    regularYearlyPremium,
    paymentPeriodYears,
    initialTopUp,
    recurringTopUp,
    adHocTopUps,
    expectedReturn,
    costOfInsurance,
    withdrawals,
  } = policy;

  // Build a lookup: policy year → ad-hoc top-up amount
  const adHocByYear: Record<number, number> = {};
  for (const { year, amount } of adHocTopUps) {
    adHocByYear[year] = (adHocByYear[year] ?? 0) + amount;
  }

  const rows: YearlyPolicyValue[] = [];
  let prevEndValue = 0;

  for (let year = 1; year <= projectionYears; year++) {
    const age = startAge + year - 1;

    // ── Inflows ──────────────────────────────────────────────────────────────
    const premiumPaid = year <= paymentPeriodYears ? regularYearlyPremium : 0;

    let topUpPaid = adHocByYear[year] ?? 0;
    if (year === 1) topUpPaid += initialTopUp;
    // Recurring top-up applies every year within the payment period (common structure)
    if (year <= paymentPeriodYears) topUpPaid += recurringTopUp;

    // ── Growth & charges ─────────────────────────────────────────────────────
    const startValue = prevEndValue + premiumPaid + topUpPaid;
    // expectedReturn and costOfInsurance are stored as whole percentages (e.g. 7 = 7%)
    const growth = startValue * (expectedReturn / 100);
    const coiCharge = startValue * (costOfInsurance / 100);

    // ── Withdrawals ───────────────────────────────────────────────────────────
    let withdrawal = 0;
    if (withdrawals !== null && age >= withdrawals.startAge) {
      withdrawal = withdrawals.monthlyAmount * 12;
    }

    // ── End value (floor at 0 — policy lapses if value goes negative) ─────────
    const endValue = Math.max(0, startValue + growth - coiCharge - withdrawal);

    rows.push({
      year,
      age,
      premiumPaid,
      topUpPaid,
      growth,
      coiCharge,
      withdrawal,
      endValue,
    });

    // If policy lapses (value reached 0), stop projecting
    if (endValue === 0 && year > 1) break;

    prevEndValue = endValue;
  }

  return rows;
}

/**
 * Convenience: total premiums + top-ups invested across all projected years.
 */
export function calculateULTotalInvested(projection: YearlyPolicyValue[]): number {
  return projection.reduce((sum, row) => sum + row.premiumPaid + row.topUpPaid, 0);
}

/**
 * Convenience: peak policy value and the year/age it occurs.
 */
export function calculateULPeakValue(
  projection: YearlyPolicyValue[]
): { peakValue: number; peakYear: number; peakAge: number } {
  let peak = { peakValue: 0, peakYear: 1, peakAge: 0 };
  for (const row of projection) {
    if (row.endValue > peak.peakValue) {
      peak = { peakValue: row.endValue, peakYear: row.year, peakAge: row.age };
    }
  }
  return peak;
}
