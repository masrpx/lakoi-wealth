"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui";
import { StoryPlayer, type StoryStep } from "@/components/layout/StoryPlayer";

const UL_STORY: StoryStep[] = [
  {
    headline: "คุณเริ่มต้นสร้างความมั่งคั่งวันนี้",
    body: "ออมเงินผ่าน Unit Link เดือนละ ฿8,333 (ปีละ ฿100,000) ตั้งแต่อายุ 35 ปี พร้อมเพิ่ม Top-up อีกปีละ ฿50,000",
  },
  {
    headline: "ผลตอบแทนทบต้นทำงานให้คุณทุกวัน",
    body: "อัตราผลตอบแทนคาดการณ์ 7% ต่อปี ทำให้มูลค่ากรมธรรม์เติบโตแบบก้าวกระโดด ทุก 10 ปีมูลค่าเพิ่มขึ้นกว่าสองเท่า",
  },
  {
    headline: "ถึงเวลาเก็บเกี่ยวที่อายุ 60",
    body: "คุณถอนเงิน ฿30,000 ต่อเดือน เป็นรายได้หลังเกษียณ ขณะที่เงินส่วนที่เหลือยังเติบโตต่อเนื่อง",
  },
  {
    headline: "มรดกความมั่งคั่งให้ทายาท",
    body: "ทุนประกันชีวิต ฿5,000,000 คุ้มครองตลอดชีพ ส่งต่อความมั่งคั่งให้คนที่คุณรักแม้เกิดเหตุไม่คาดฝัน",
  },
];
import { UnitLinkLifetimeChart } from "@/components/insurance/UnitLinkLifetimeChart";
import { ULComparisonChart, getLineMetrics, fmtBahtShort, type ComparisonLine } from "@/components/charts/ULComparisonChart";
import { calculateUnitLinkProjection, calculateULPeakValue } from "@/lib/calculations/unit-link";
import { DEMO_UL } from "@/lib/data/demo-data";
import type { UnitLinkPolicy } from "@/types/insurance";

// ── Helpers ──────────────────────────────────────────────────────────────────

function sliderFill(value: number, min: number, max: number) {
  return { "--slider-fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

function fmtBahtK(v: number) {
  return v >= 1_000_000 ? `฿${(v / 1_000_000).toFixed(1)}M` : `฿${(v / 1_000).toFixed(0)}K`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SliderField({
  label, value, min, max, step, fmt, color = "var(--gold-500)",
  onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  fmt: (v: number) => string; color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={sliderFill(value, min, max)}
      />
    </div>
  );
}

function MetricCard({
  name, color, peakValue, peakAge, lapseAge, finalValue, finalAge,
}: ReturnType<typeof getLineMetrics> & { name: string; color: string }) {
  return (
    <div
      className="flex-1 rounded-xl p-3 min-w-0"
      style={{
        background: `${color}0d`,
        border: `1.5px solid ${color}33`,
      }}
    >
      <p className="text-xs font-bold truncate mb-1" style={{ color }}>{name}</p>
      <p className="text-lg font-bold text-display" style={{ color }}>{fmtBahtShort(peakValue)}</p>
      <p className="text-xs text-muted-foreground">peak อายุ {peakAge} ปี</p>
      {lapseAge ? (
        <p className="text-xs mt-1" style={{ color: "#fb7185" }}>หมดอายุ {lapseAge} ปี</p>
      ) : (
        <p className="text-xs mt-1 text-muted-foreground">มูลค่า {fmtBahtShort(finalValue)} อายุ {finalAge}</p>
      )}
    </div>
  );
}

// ── Scenario presets ──────────────────────────────────────────────────────────

const PRESET_LABELS = [
  "ไม่ Top-up vs Top-up ฿50K/ปี",
  "ถอน ฿30K vs ฿50K/เดือน",
  "Return 5% vs 7% vs 9%",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ULLifetimePage() {
  const router = useRouter();

  // Sensitivity slider state (seeded from DEMO_UL)
  const [yearlyPremium, setYearlyPremium] = useState(DEMO_UL.regularYearlyPremium);
  const [recurringTopUp, setRecurringTopUp] = useState(DEMO_UL.recurringTopUp);
  const [sumInsured, setSumInsured] = useState(DEMO_UL.sumInsured);
  const [expectedReturn, setExpectedReturn] = useState(DEMO_UL.expectedReturn);
  const [adminFee, setAdminFee] = useState(DEMO_UL.adminFee ?? 0);
  const [withdrawalStartAge, setWithdrawalStartAge] = useState(DEMO_UL.withdrawals?.startAge ?? 60);
  const [withdrawalMonthly, setWithdrawalMonthly] = useState(DEMO_UL.withdrawals?.monthlyAmount ?? 30000);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const { mode } = useUIStore();

  // Live policy built from sliders — < 1ms, no debounce needed
  const liveDraft = useMemo((): UnitLinkPolicy => ({
    ...DEMO_UL,
    regularYearlyPremium: yearlyPremium,
    recurringTopUp,
    sumInsured,
    expectedReturn,
    adminFee,
    withdrawals: { startAge: withdrawalStartAge, monthlyAmount: withdrawalMonthly },
  }), [yearlyPremium, recurringTopUp, sumInsured, expectedReturn, adminFee, withdrawalStartAge, withdrawalMonthly]);

  // Key insight values
  const liveProjection = useMemo(
    () => calculateUnitLinkProjection(liveDraft, liveDraft.startAge, 60),
    [liveDraft]
  );
  const { peakValue, peakAge } = useMemo(() => calculateULPeakValue(liveProjection), [liveProjection]);
  const withdrawalRunwayAge = useMemo(() => {
    const rows = liveProjection.filter((r) => r.withdrawal > 0);
    return [...rows].reverse().find((r) => r.endValue > 0)?.age ?? null;
  }, [liveProjection]);

  // Comparison scenario lines — built from live policy + patches
  const comparisonLines = useMemo((): ComparisonLine[] | null => {
    if (activeScenario === null) return null;

    const project = (patch: Partial<UnitLinkPolicy>) =>
      calculateUnitLinkProjection({ ...liveDraft, ...patch }, liveDraft.startAge, 60);

    if (activeScenario === 0) {
      return [
        { name: "ไม่ Top-up", color: "#60a5fa", data: project({ recurringTopUp: 0, initialTopUp: 0 }) },
        { name: "Top-up ฿50K/ปี", color: "#2dd4bf", data: project({ recurringTopUp: 50000 }) },
      ];
    }
    if (activeScenario === 1) {
      return [
        { name: "ถอน ฿30K/เดือน", color: "#2dd4bf", data: project({ withdrawals: { startAge: withdrawalStartAge, monthlyAmount: 30000 } }) },
        { name: "ถอน ฿50K/เดือน", color: "#fb7185", data: project({ withdrawals: { startAge: withdrawalStartAge, monthlyAmount: 50000 } }) },
      ];
    }
    // scenario 2: return comparison
    return [
      { name: "5%", color: "#60a5fa", data: project({ expectedReturn: 5 }) },
      { name: "7%", color: "#2dd4bf", data: project({ expectedReturn: 7 }) },
      { name: "9%", color: "#c9a84c", data: project({ expectedReturn: 9 }) },
    ];
  }, [activeScenario, liveDraft, withdrawalStartAge]);

  const comparisonMetrics = useMemo(
    () => comparisonLines?.map((l) => ({ ...getLineMetrics(l), name: l.name, color: l.color })),
    [comparisonLines]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"
          onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">Unit Link Lifetime</h1>
          <p className="text-xs text-muted-foreground">เงินคุณ ทำงานยังไงตลอดชีวิต</p>
        </div>
        {mode === "presentation" && (
          <Button
            size="sm"
            className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0"
            style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
            onClick={() => setStoryOpen(true)}
          >
            <Play className="h-3.5 w-3.5" />
            เล่าเรื่อง
          </Button>
        )}
      </header>
      {storyOpen && (
        <StoryPlayer steps={UL_STORY} onClose={() => setStoryOpen(false)} />
      )}

      <div className="flex-1 overflow-y-auto">
        {/* ── Sensitivity sliders — 3 columns (hidden in presentation mode) ── */}
        <div
          data-input-panel
          className="grid grid-cols-3 gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          {/* Column 1: Premium + Death Coverage */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              เบี้ยและ Top-up
            </p>
            <SliderField
              label="เบี้ยปกติ/ปี"
              value={yearlyPremium} min={50000} max={300000} step={10000}
              fmt={fmtBahtK} color="#fb7185"
              onChange={setYearlyPremium}
            />
            <SliderField
              label="Top-up เพิ่ม/ปี"
              value={recurringTopUp} min={0} max={200000} step={10000}
              fmt={fmtBahtK} color="var(--gold-500)"
              onChange={setRecurringTopUp}
            />
            <SliderField
              label="ทุนชีวิต"
              value={sumInsured} min={500000} max={10000000} step={500000}
              fmt={fmtBahtK} color="#c9a84c"
              onChange={setSumInsured}
            />
          </div>

          {/* Column 2: Return scenarios + Admin fee */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              ผลตอบแทนคาดหวัง
            </p>
            <SliderField
              label="ผลตอบแทน/ปี"
              value={expectedReturn} min={3} max={12} step={0.5}
              fmt={(v) => `${v.toFixed(1)}%`} color="#2dd4bf"
              onChange={setExpectedReturn}
            />
            <div className="flex gap-1.5">
              {([
                { label: "Conservative", r: 4 },
                { label: "Balanced", r: 7 },
                { label: "Aggressive", r: 10 },
              ] as const).map(({ label, r }) => (
                <button
                  key={r}
                  type="button"
                  className="flex-1 py-1.5 rounded-lg text-xs leading-tight transition-all"
                  style={{
                    background: expectedReturn === r ? "#2dd4bf" : "var(--bg-elevated)",
                    color: expectedReturn === r ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${expectedReturn === r ? "#2dd4bf" : "var(--border)"}`,
                  }}
                  onClick={() => setExpectedReturn(r)}
                >
                  {label}
                  <br />
                  <span className="font-bold">{r}%</span>
                </button>
              ))}
            </div>
            <SliderField
              label="ค่าธรรมเนียมกองทุน/ปี"
              value={adminFee} min={0} max={3} step={0.25}
              fmt={(v) => `${v.toFixed(2)}%`} color="#9f7aea"
              onChange={setAdminFee}
            />
          </div>

          {/* Column 3: Withdrawal */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              แผนการถอนเงิน
            </p>
            <SliderField
              label="เริ่มถอนอายุ"
              value={withdrawalStartAge} min={50} max={70} step={1}
              fmt={(v) => `${v} ปี`} color="#c9a84c"
              onChange={setWithdrawalStartAge}
            />
            <SliderField
              label="ถอน/เดือน"
              value={withdrawalMonthly} min={10000} max={100000} step={5000}
              fmt={fmtBahtK} color="#fb7185"
              onChange={setWithdrawalMonthly}
            />
          </div>
        </div>

        {/* ── Live chart (reusing UnitLinkLifetimeChart) ── */}
        <div className="px-4 pt-4 pb-2">
          <UnitLinkLifetimeChart policy={liveDraft} targetAge={0} />
        </div>

        {/* ── Compare Scenarios ── */}
        <div
          className="mx-4 mb-4 rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: "var(--text-muted)" }}>
              เปรียบเทียบ Scenarios
            </p>
            {activeScenario !== null && (
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md"
                style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                onClick={() => setActiveScenario(null)}
              >
                ปิด ✕
              </button>
            )}
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2 p-3" style={{ background: "var(--bg-elevated)" }}>
            {PRESET_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                className="flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all text-center leading-snug"
                style={{
                  background: activeScenario === i ? "rgba(201,168,76,0.15)" : "var(--bg-surface)",
                  border: `1.5px solid ${activeScenario === i ? "var(--gold-500)" : "var(--border)"}`,
                  color: activeScenario === i ? "var(--gold-500)" : "var(--text-secondary)",
                }}
                onClick={() => setActiveScenario(activeScenario === i ? null : i)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Comparison chart + metrics */}
          {comparisonLines && comparisonMetrics && (
            <div className="px-4 pb-4" style={{ background: "var(--bg-surface)" }}>
              <ULComparisonChart lines={comparisonLines} startAge={liveDraft.startAge} />
              <div className="flex gap-3 mt-3 flex-wrap">
                {comparisonMetrics.map((m) => (
                  <MetricCard key={m.name} {...m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom insight bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-5 py-3"
        style={{
          background: "var(--bg-elevated)",
          borderTop: "1.5px solid var(--gold-500)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--gold-500)" }}>
          ถ้าทำตามแผนนี้
        </p>
        <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
          มูลค่าสูงสุด{" "}
          <span className="font-bold" style={{ color: "#2dd4bf" }}>
            {fmtBahtShort(peakValue)}
          </span>{" "}
          ที่อายุ {peakAge} ปี
          {withdrawalRunwayAge ? (
            <>
              {" · "}ถอน{" "}
              <span className="font-bold" style={{ color: "var(--gold-500)" }}>
                {fmtBahtShort(withdrawalMonthly)}
              </span>
              /เดือน ได้จนถึงอายุ{" "}
              <span className="font-bold" style={{ color: "var(--gold-500)" }}>
                {withdrawalRunwayAge} ปี
              </span>
            </>
          ) : (
            " · ไม่มีแผนถอนเงิน"
          )}
        </p>
      </div>
    </div>
  );
}
