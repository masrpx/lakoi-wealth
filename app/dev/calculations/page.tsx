/**
 * Dev-only verification page — not linked from production nav.
 * Shows raw calculation output so we can sanity-check numbers before building UI.
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
const healthTotalPaid = calculateHealthTotalPaid(
  { ...DEMO_HEALTH, yearlyPremiumByAge: filledGrid },
  DEMO_HEALTH.startAge,
  DEMO_HEALTH.endAge
);
const healthSchedule = buildHealthPremiumSchedule({
  ...DEMO_HEALTH,
  yearlyPremiumByAge: filledGrid,
});

const ulProjection = calculateUnitLinkProjection(DEMO_UL, CURRENT_AGE, 40);
const ulTotalInvested = calculateULTotalInvested(ulProjection);
const ulPeak = calculateULPeakValue(ulProjection);

// ── Render ────────────────────────────────────────────────────────────────────

export default function CalcDevPage() {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, padding: 24, background: "#fff", color: "#0f172a" }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        🧮 Calculation Verification — Dev Only
      </h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>
        All figures use DEMO data (client age 35, policy start age 35).
        Remove this route before production.
      </p>

      {/* ── Endowment ── */}
      <Section title="Endowment: ไทยประกัน เอนดาวเม้นท์ 20">
        <KV label="Total Paid"       value={`฿${endowmentMetrics.totalPaid.toLocaleString()}`} />
        <KV label="Final Cash Value" value={`฿${endowmentMetrics.finalCashValue.toLocaleString()}`} />
        <KV label="IRR"              value={`${(endowmentMetrics.irr * 100).toFixed(2)}%`} />
        <KV label="Net Gain"         value={`฿${(endowmentMetrics.finalCashValue - endowmentMetrics.totalPaid).toLocaleString()}`} />

        <h3 style={{ marginTop: 16, marginBottom: 4, fontWeight: "bold" }}>
          Timeline ({endowmentTimeline.length} years)
        </h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Yr","Age","Premium","Cumulative Paid","Cash Value","Gain","Past?"].map(h => (
                <th key={h} style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {endowmentTimeline.map((row) => (
              <tr key={row.year} style={{ background: row.isPast ? "#fef9ec" : undefined }}>
                <Td>{row.year}</Td>
                <Td>{row.age}</Td>
                <Td>{row.premiumPaid.toLocaleString()}</Td>
                <Td>{row.cumulativePaid.toLocaleString()}</Td>
                <Td>{row.cashValue.toLocaleString()}</Td>
                <Td style={{ color: row.gain >= 0 ? "#0d9488" : "#e11d48" }}>
                  {row.gain >= 0 ? "+" : ""}{row.gain.toLocaleString()}
                </Td>
                <Td>{row.isPast ? "✓" : ""}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Health ── */}
      <Section title="Health: เมืองไทย เฮลท์ พลัส">
        <KV label="Coverage"     value={`Age ${DEMO_HEALTH.startAge} – ${DEMO_HEALTH.endAge}`} />
        <KV label="Sum Insured"  value={`฿${DEMO_HEALTH.sumInsured.toLocaleString()}`} />
        <KV label="Total Paid"   value={`฿${healthTotalPaid.toLocaleString()}`} />

        <h3 style={{ marginTop: 16, marginBottom: 4, fontWeight: "bold" }}>
          Premium Schedule ({healthSchedule.length} years, after interpolation)
        </h3>
        <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Age", "Premium (฿/yr)"].map(h => (
                <th key={h} style={{ padding: "4px 12px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {healthSchedule.map(({ age, premium }) => (
              <tr key={age}>
                <Td>{age}</Td>
                <Td>{premium.toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Unit Link ── */}
      <Section title="Unit Link: AIA Unit Link">
        <KV label="Total Invested" value={`฿${ulTotalInvested.toLocaleString()}`} />
        <KV label="Peak Value"     value={`฿${Math.round(ulPeak.peakValue).toLocaleString()} at age ${ulPeak.peakAge} (yr ${ulPeak.peakYear})`} />
        <KV label="Final Value (yr 40)" value={`฿${Math.round(ulProjection[ulProjection.length - 1]?.endValue ?? 0).toLocaleString()}`} />

        <h3 style={{ marginTop: 16, marginBottom: 4, fontWeight: "bold" }}>
          Projection ({ulProjection.length} years)
        </h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Yr","Age","Premium","Top-Up","Growth","COI","Withdrawal","End Value"].map(h => (
                <th key={h} style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ulProjection.map((row) => (
              <tr key={row.year} style={{ background: row.withdrawal > 0 ? "#f0fdf4" : undefined }}>
                <Td>{row.year}</Td>
                <Td>{row.age}</Td>
                <Td>{Math.round(row.premiumPaid).toLocaleString()}</Td>
                <Td>{Math.round(row.topUpPaid).toLocaleString()}</Td>
                <Td style={{ color: "#0d9488" }}>+{Math.round(row.growth).toLocaleString()}</Td>
                <Td style={{ color: "#e11d48" }}>-{Math.round(row.coiCharge).toLocaleString()}</Td>
                <Td style={{ color: row.withdrawal > 0 ? "#2563eb" : undefined }}>
                  {row.withdrawal > 0 ? `-${Math.round(row.withdrawal).toLocaleString()}` : "—"}
                </Td>
                <Td style={{ fontWeight: "bold" }}>{Math.round(row.endValue).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <p style={{ marginTop: 32, color: "#94a3b8", fontSize: 11 }}>
        Route: /dev/calculations · Remove before production deploy
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: "bold", borderBottom: "2px solid #c9a84c", paddingBottom: 6, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
      <span style={{ color: "#64748b", width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", ...style }}>
      {children}
    </td>
  );
}
