/**
 * Dev-only verification page — not linked from production nav.
 * Shows raw calculation output to sanity-check numbers before building UI.
 */
import { DEMO_ENDOWMENT, DEMO_HEALTH, DEMO_UL } from "@/lib/data/demo-data";
import { calculateEndowmentMetrics, calculateEndowmentTimeline } from "@/lib/calculations/endowment";
import {
  fillHealthPremiumGrid,
  calculateHealthTotalPaid,
  buildHealthPremiumSchedule,
} from "@/lib/calculations/health-premium";
import {
  calculateUnitLinkProjection,
  calculateULTotalInvested,
  calculateULPeakValue,
} from "@/lib/calculations/unit-link";

const CURRENT_AGE = 35;

// ── Run all calculations ──────────────────────────────────────────────────────

const endowmentMetrics = calculateEndowmentMetrics(DEMO_ENDOWMENT);
const endowmentTimeline = calculateEndowmentTimeline(DEMO_ENDOWMENT, CURRENT_AGE);

const filledGrid = fillHealthPremiumGrid(
  DEMO_HEALTH.yearlyPremiumByAge,
  DEMO_HEALTH.startAge,
  DEMO_HEALTH.endAge
);
const healthWithGrid = { ...DEMO_HEALTH, yearlyPremiumByAge: filledGrid };
const healthTotalPaid = calculateHealthTotalPaid(healthWithGrid, DEMO_HEALTH.startAge, DEMO_HEALTH.endAge);
const healthSchedule = buildHealthPremiumSchedule(healthWithGrid);

const ulProjection = calculateUnitLinkProjection(DEMO_UL, CURRENT_AGE, 40);
const ulTotalInvested = calculateULTotalInvested(ulProjection);
const ulPeak = calculateULPeakValue(ulProjection);

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => Math.round(n).toLocaleString();
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// ── Render ────────────────────────────────────────────────────────────────────

export default function CalcDevPage() {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, padding: 24, background: "#fff", color: "#0f172a" }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
        🧮 Calculation Verification — Dev Only
      </h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>
        Demo client: คุณสมชาย ใจดี, age {CURRENT_AGE}. Remove this route before production.
      </p>

      {/* ── Endowment ── */}
      <Section title={`Endowment — ${DEMO_ENDOWMENT.name}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 16 }}>
          <div>
            <SubHead>Guaranteed</SubHead>
            <KV label="Total Paid"       value={`฿${fmt(endowmentMetrics.totalPaid)}`} />
            <KV label="Maturity Value"   value={`฿${fmt(endowmentMetrics.finalCashValue)}`} />
            <KV label="Net Gain"         value={`฿${fmt(endowmentMetrics.finalCashValue - endowmentMetrics.totalPaid)}`} />
            <KV label="IRR"              value={pct(endowmentMetrics.irr)} />
          </div>
          <div>
            <SubHead>Projected (incl. dividends)</SubHead>
            <KV label="Projected Payout" value={endowmentMetrics.projectedMaturityValue ? `฿${fmt(endowmentMetrics.projectedMaturityValue)}` : "—"} />
            <KV label="Projected Gain"   value={endowmentMetrics.projectedGain != null ? `฿${fmt(endowmentMetrics.projectedGain)}` : "—"} />
            <KV label="Projected IRR"    value={endowmentMetrics.projectedIRR != null ? pct(endowmentMetrics.projectedIRR) : "—"} />
          </div>
        </div>

        <h3 style={{ fontWeight: "bold", marginBottom: 6 }}>
          Year-by-year timeline ({endowmentTimeline.length} years)
        </h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Yr", "Age", "Premium", "Cumul. Paid", "Cash Value (Guar.)", "Gain", "Projected Value", "Past?"].map(h => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {endowmentTimeline.map((row) => (
              <tr key={row.year} style={{ background: row.isPast ? "#fefce8" : undefined }}>
                <Td>{row.year}</Td>
                <Td>{row.age}</Td>
                <Td>{fmt(row.premiumPaid)}</Td>
                <Td>{fmt(row.cumulativePaid)}</Td>
                <Td>{fmt(row.cashValue)}</Td>
                <Td style={{ color: row.gain >= 0 ? "#0d9488" : "#e11d48" }}>
                  {row.gain >= 0 ? "+" : ""}{fmt(row.gain)}
                </Td>
                <Td style={{ color: "#7c3aed", fontWeight: row.projectedValue ? "bold" : undefined }}>
                  {row.projectedValue ? `฿${fmt(row.projectedValue)}` : "—"}
                </Td>
                <Td>{row.isPast ? "✓" : ""}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Health ── */}
      <Section title={`Health — ${DEMO_HEALTH.name}`}>
        <KV label="Coverage"    value={`Age ${DEMO_HEALTH.startAge} – ${DEMO_HEALTH.endAge}`} />
        <KV label="Sum Insured" value={`฿${fmt(DEMO_HEALTH.sumInsured)}`} />
        <KV label="Total Paid"  value={`฿${fmt(healthTotalPaid)}`} />
        <KV label="Checkpoints input" value={`${Object.keys(DEMO_HEALTH.yearlyPremiumByAge).length} ages → interpolated to ${healthSchedule.length} ages`} />

        <h3 style={{ fontWeight: "bold", margin: "16px 0 6px" }}>
          Premium schedule after interpolation ({healthSchedule.length} years)
        </h3>
        <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Age", "Premium (฿/yr)", "Cumulative Paid (฿)"].map(h => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {healthSchedule.map(({ age, premium, cumulativePaid }) => (
              <tr key={age} style={{ background: Object.keys(DEMO_HEALTH.yearlyPremiumByAge).includes(String(age)) ? "#f0fdf4" : undefined }}>
                <Td>{age}</Td>
                <Td>{fmt(premium)}</Td>
                <Td>{fmt(cumulativePaid)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Green rows = agent-entered checkpoints</p>
      </Section>

      {/* ── Unit Link ── */}
      <Section title={`Unit Link — ${DEMO_UL.name}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 16 }}>
          <div>
            <KV label="Return rate"     value={`${DEMO_UL.expectedReturn}% / yr`} />
            <KV label="COI rate"        value={`${DEMO_UL.costOfInsurance}% / yr`} />
            <KV label="Total Invested"  value={`฿${fmt(ulTotalInvested)}`} />
          </div>
          <div>
            <KV label="Peak Value"      value={`฿${fmt(ulPeak.peakValue)} at age ${ulPeak.peakAge} (yr ${ulPeak.peakYear})`} />
            <KV label="Final Value"     value={`฿${fmt(ulProjection[ulProjection.length - 1]?.endValue ?? 0)} (yr ${ulProjection.length})`} />
            <KV label="Withdrawal start" value={`Age ${DEMO_UL.withdrawals?.startAge} · ฿${fmt((DEMO_UL.withdrawals?.monthlyAmount ?? 0) * 12)}/yr`} />
          </div>
        </div>

        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Yr", "Age", "Premium", "Top-Up", "Growth", "COI", "Withdrawal", "End Value"].map(h => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ulProjection.map((row) => (
              <tr key={row.year} style={{ background: row.withdrawal > 0 ? "#f0fdf4" : undefined }}>
                <Td>{row.year}</Td>
                <Td>{row.age}</Td>
                <Td>{fmt(row.premiumPaid)}</Td>
                <Td>{row.topUpPaid > 0 ? fmt(row.topUpPaid) : "—"}</Td>
                <Td style={{ color: "#0d9488" }}>+{fmt(row.growth)}</Td>
                <Td style={{ color: "#e11d48" }}>-{fmt(row.coiCharge)}</Td>
                <Td style={{ color: row.withdrawal > 0 ? "#2563eb" : undefined }}>
                  {row.withdrawal > 0 ? `-${fmt(row.withdrawal)}` : "—"}
                </Td>
                <Td style={{ fontWeight: "bold" }}>{fmt(row.endValue)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Green rows = withdrawal phase</p>
      </Section>

      <p style={{ color: "#94a3b8", fontSize: 11 }}>
        Route: /dev/calculations · Remove before production deploy
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 15, fontWeight: "bold", borderBottom: "2px solid #c9a84c", paddingBottom: 6, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <p style={{ fontWeight: "bold", marginBottom: 6, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>{children}</p>;
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
      <span style={{ color: "#64748b", width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", ...style }}>
      {children}
    </td>
  );
}
