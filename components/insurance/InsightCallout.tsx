import type { EndowmentMetrics, EndowmentPolicy } from "@/types/insurance";

interface InsightCalloutProps {
  policy: EndowmentPolicy;
  metrics: EndowmentMetrics;
  crossoverAge: number | null;
}

function formatBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

export function InsightCallout({ policy, metrics, crossoverAge }: InsightCalloutProps) {
  const maturityAge = policy.startAge + policy.coveragePeriodYears - 1;
  const displayValue = metrics.projectedMaturityValue ?? metrics.finalCashValue;
  const displayIRR = metrics.projectedIRR ?? metrics.irr;
  const hasProjected = metrics.projectedMaturityValue !== undefined;

  const lines: string[] = [];

  // Line 1: what they pay
  lines.push(
    `ชำระเบี้ย ${policy.paymentPeriodYears} ปี รวม ${formatBaht(metrics.totalPaid)}`
  );

  // Line 2: what they get back
  if (hasProjected) {
    lines.push(
      `คาดได้รับรวมเงินปันผล ${formatBaht(displayValue)} ที่อายุ ${maturityAge} ปี`
    );
  } else {
    lines.push(
      `ได้เงินคืน ${formatBaht(metrics.finalCashValue)} ที่อายุ ${maturityAge} ปี`
    );
  }

  // Line 3: IRR / break-even
  if (crossoverAge !== null) {
    lines.push(
      `คุ้มทุนที่อายุ ${crossoverAge} ปี · ผลตอบแทน ${(displayIRR * 100).toFixed(2)}% ต่อปี`
    );
  } else {
    lines.push(`ผลตอบแทน ${(displayIRR * 100).toFixed(2)}% ต่อปี`);
  }

  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        border: "1.5px solid var(--gold-500)",
        background: "rgba(201,168,76,0.06)",
        boxShadow: "var(--shadow-glow-gold)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gold-700)" }}>
        สรุปกรมธรรม์
      </p>
      {lines.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: i === 0 ? "var(--text-secondary)" : "var(--text-primary)" }}>
          {i === 0 ? line : <strong>{line}</strong>}
        </p>
      ))}
    </div>
  );
}
