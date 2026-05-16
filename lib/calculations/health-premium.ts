import type { HealthPolicy, HealthScheduleRow } from "@/types/insurance";

/**
 * Returns the yearly premium for a given age, or 0 if outside coverage period.
 * Uses the filled grid (yearlyPremiumByAge) directly — call fillHealthPremiumGrid
 * first if the grid was entered sparsely.
 */
export function getHealthPremiumByAge(policy: HealthPolicy, age: number): number {
  if (age < policy.startAge || age > policy.endAge) return 0;
  return policy.yearlyPremiumByAge[age] ?? 0;
}

/**
 * Sum of all premiums from fromAge to toAge (inclusive).
 */
export function calculateHealthTotalPaid(
  policy: HealthPolicy,
  fromAge: number,
  toAge: number
): number {
  let total = 0;
  const start = Math.max(fromAge, policy.startAge);
  const end = Math.min(toAge, policy.endAge);
  for (let age = start; age <= end; age++) {
    total += getHealthPremiumByAge(policy, age);
  }
  return total;
}

/**
 * Takes a sparse set of age → premium checkpoints (e.g. the agent typed values
 * at age 35, 40, 45 …) and returns a fully-filled record for every age from
 * startAge to endAge using linear interpolation between checkpoints.
 *
 * - Ages before the first checkpoint receive the first checkpoint's value.
 * - Ages after the last checkpoint receive the last checkpoint's value.
 * - Values are rounded to the nearest whole baht.
 */
export function fillHealthPremiumGrid(
  sparseInputs: Record<number, number>,
  startAge: number,
  endAge: number
): Record<number, number> {
  // Sort available checkpoint ages that fall within [startAge, endAge]
  const checkpoints = Object.keys(sparseInputs)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((age) => age >= startAge && age <= endAge);

  if (checkpoints.length === 0) {
    // Nothing to interpolate — return zeroes
    const empty: Record<number, number> = {};
    for (let age = startAge; age <= endAge; age++) empty[age] = 0;
    return empty;
  }

  const result: Record<number, number> = {};

  for (let age = startAge; age <= endAge; age++) {
    if (sparseInputs[age] !== undefined) {
      result[age] = sparseInputs[age];
      continue;
    }

    // Find the bounding checkpoints
    const prevCP = [...checkpoints].reverse().find((a) => a < age);
    const nextCP = checkpoints.find((a) => a > age);

    if (prevCP === undefined) {
      // Before the first checkpoint — clamp to first
      result[age] = sparseInputs[checkpoints[0]];
    } else if (nextCP === undefined) {
      // After the last checkpoint — clamp to last
      result[age] = sparseInputs[checkpoints[checkpoints.length - 1]];
    } else {
      // Linear interpolation
      const t = (age - prevCP) / (nextCP - prevCP);
      result[age] = Math.round(
        sparseInputs[prevCP] + t * (sparseInputs[nextCP] - sparseInputs[prevCP])
      );
    }
  }

  return result;
}

/**
 * Year-by-year premium schedule with running cumulative total.
 */
export function buildHealthPremiumSchedule(policy: HealthPolicy): HealthScheduleRow[] {
  const rows: HealthScheduleRow[] = [];
  let cumulativePaid = 0;
  for (let age = policy.startAge; age <= policy.endAge; age++) {
    const premium = getHealthPremiumByAge(policy, age);
    cumulativePaid += premium;
    rows.push({ age, premium, cumulativePaid });
  }
  return rows;
}
