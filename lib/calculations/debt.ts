import type { LiabilityCategory } from "@/types";

export const DEFAULT_RATES: Record<LiabilityCategory, number> = {
  home_loan:     3.0,
  car_loan:      5.0,
  personal_loan: 12.0,
  credit_card:   18.0,
  other:          7.0,
};

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  annualRate: number; // % e.g. 5.0
}

export interface DebtSimResult {
  months: number;
  totalInterest: number;
  payoffOrder: string[];
  debtFreeAge: number;
}

export function simulateDebtPayoff(
  debts: DebtItem[],
  strategy: "avalanche" | "snowball",
  extraMonthly: number,
  currentAge: number
): DebtSimResult {
  if (!debts.length) return { months: 0, totalInterest: 0, payoffOrder: [], debtFreeAge: currentAge };

  const work = debts.map((d) => ({ ...d }));
  let totalInterest = 0;
  let month = 0;
  const order: string[] = [];
  let pool = extraMonthly; // grows as debts are paid off (cascade)

  while (work.some((d) => d.balance > 1) && month < 720) {
    month++;

    // Apply monthly interest
    for (const d of work) {
      if (d.balance <= 1) continue;
      const i = d.balance * (d.annualRate / 1200);
      totalInterest += i;
      d.balance += i;
    }

    // Pay minimum payments
    for (const d of work) {
      if (d.balance <= 1) continue;
      d.balance = Math.max(0, d.balance - Math.min(d.monthlyPayment, d.balance));
    }

    // Apply pool (extra + cascaded freed minimums) to priority debt
    const active = work
      .filter((d) => d.balance > 1)
      .sort((a, b) =>
        strategy === "avalanche" ? b.annualRate - a.annualRate : a.balance - b.balance
      );
    if (active[0]) active[0].balance = Math.max(0, active[0].balance - pool);

    // Cascade freed minimum payments when a debt hits zero
    for (const d of work) {
      if (d.balance <= 1 && !order.includes(d.name)) {
        order.push(d.name);
        pool += d.monthlyPayment;
      }
    }
  }

  return {
    months: month,
    totalInterest,
    payoffOrder: order,
    debtFreeAge: currentAge + Math.ceil(month / 12),
  };
}
