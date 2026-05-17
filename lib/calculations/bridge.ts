import type { EndowmentPolicy, HealthPolicy } from "@/types/insurance";

export interface BridgeDataPoint {
  age: number;
  /** Negative — endowment premium paid (before maturity). 0 elsewhere. */
  endowmentPremium: number;
  /** Positive — lump sum received at maturity year. 0 elsewhere. */
  lumpSum: number;
  /** Negative — health premium (from maturity onward, step-function). 0 before maturity. */
  healthPremium: number;
  /** Null before maturity. Depletes from maturity onward. 0 when fund exhausted. */
  fundBalance: number | null;
}

export interface BridgeResult {
  startAge: number;
  endAge: number;
  maturityAge: number;
  baseMaturityValue: number;
  adjustedMaturityValue: number;
  endowmentTotalPaid: number;
  /** Last age for which the fund fully covered the health premium. */
  healthRunwayAge: number;
  yearsOfCoverage: number;
  dataPoints: BridgeDataPoint[];
}

/** Step-function: each age inherits the most recent checkpoint at or before it. */
export function getHealthPremiumAtAge(
  yearlyPremiumByAge: Record<number, number>,
  age: number
): number {
  const checkpoints = Object.entries(yearlyPremiumByAge)
    .map(([k, v]) => ({ age: Number(k), value: v }))
    .sort((a, b) => a.age - b.age);
  const prev = [...checkpoints].reverse().find((e) => e.age <= age);
  return prev?.value ?? 0;
}

export function calculateBridge(
  endowment: EndowmentPolicy,
  health: HealthPolicy,
  sensitivityPct = 0
): BridgeResult {
  const maturityAge = endowment.startAge + endowment.coveragePeriodYears - 1;
  const baseMaturityValue =
    endowment.projectedMaturityValue ??
    endowment.cashValueByYear[endowment.coveragePeriodYears - 1] ??
    endowment.sumInsured;

  const adjustedMaturityValue = Math.round(baseMaturityValue * (1 + sensitivityPct / 100));
  const startAge = endowment.startAge;
  const endAge = health.endAge;

  const dataPoints: BridgeDataPoint[] = [];
  let fundBalance: number | null = null;
  let healthRunwayAge = maturityAge;

  for (let age = startAge; age <= endAge; age++) {
    const inPaymentPeriod =
      age >= endowment.startAge &&
      age < endowment.startAge + endowment.paymentPeriodYears;
    const isMaturity = age === maturityAge;

    // Endowment bars: premiums before maturity year (maturity year shows lump sum instead)
    const endowmentPremium = inPaymentPeriod && !isMaturity ? -endowment.yearlyPremium : 0;

    // Lump sum bar: only at maturity age
    const lumpSum = isMaturity ? adjustedMaturityValue : 0;

    // Health premium: step-function from maturity onward
    const rawHealth = age >= maturityAge ? getHealthPremiumAtAge(health.yearlyPremiumByAge, age) : 0;
    const healthPremium = rawHealth > 0 ? -rawHealth : 0;

    // Fund balance: starts at adjustedMaturityValue at maturity, depletes each year
    if (isMaturity) {
      fundBalance = rawHealth > 0
        ? Math.max(0, adjustedMaturityValue - rawHealth)
        : adjustedMaturityValue;
      if (rawHealth > 0 && adjustedMaturityValue >= rawHealth) healthRunwayAge = age;
    } else if (age > maturityAge && fundBalance !== null && fundBalance > 0) {
      if (rawHealth > 0) {
        if (fundBalance >= rawHealth) {
          fundBalance = fundBalance - rawHealth;
          healthRunwayAge = age;
        } else {
          fundBalance = 0;
        }
      }
    }

    dataPoints.push({
      age,
      endowmentPremium,
      lumpSum,
      healthPremium,
      fundBalance: age >= maturityAge ? (fundBalance ?? 0) : null,
    });
  }

  return {
    startAge,
    endAge,
    maturityAge,
    baseMaturityValue,
    adjustedMaturityValue,
    endowmentTotalPaid: endowment.yearlyPremium * endowment.paymentPeriodYears,
    healthRunwayAge,
    yearsOfCoverage: healthRunwayAge - maturityAge + 1,
    dataPoints,
  };
}
