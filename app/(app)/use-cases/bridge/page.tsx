"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BridgeFlowChart, type HighlightPhase } from "@/components/charts/BridgeFlowChart";
import { calculateBridge } from "@/lib/calculations/bridge";
import { useInsuranceStore } from "@/lib/store/insurance";
import { DEMO_ENDOWMENT, DEMO_HEALTH } from "@/lib/data/demo-data";
import type { EndowmentPolicy, HealthPolicy } from "@/types/insurance";

function fmtBaht(n: number): string {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function fmtBahtShort(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function OutcomeCard({
  label, value, sub, color, highlight,
}: {
  label: string; value: string; sub?: string; color: string; highlight?: boolean;
}) {
  return (
    <div
      className="flex-1 rounded-xl p-4 min-w-0 transition-all duration-500"
      style={{
        background: highlight ? `${color}18` : "var(--bg-surface)",
        border: `1.5px solid ${highlight ? color : "var(--border)"}`,
        boxShadow: highlight ? `0 0 16px ${color}33` : "var(--shadow-card)",
      }}
    >
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-2xl font-bold mt-1 truncate text-display" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

const STORY_PHASE_MAP: HighlightPhase[] = ["endowment", "maturity", "health", null];

export default function BridgePage() {
  const router = useRouter();
  const { policies, addPolicy } = useInsuranceStore();

  // Seed demo data if store is empty
  useEffect(() => {
    const hasEndowment = policies.some((p) => p.type === "endowment");
    const hasHealth = policies.some((p) => p.type === "health");
    if (!hasEndowment) addPolicy(DEMO_ENDOWMENT);
    if (!hasHealth) addPolicy(DEMO_HEALTH);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endowmentPolicies = policies.filter((p): p is EndowmentPolicy => p.type === "endowment");
  const healthPolicies = policies.filter((p): p is HealthPolicy => p.type === "health");

  const [endowmentId, setEndowmentId] = useState<string>("");
  const [healthId, setHealthId] = useState<string>("");
  const [sensitivity, setSensitivity] = useState(0); // -20 to +20

  // Story mode state
  const [storyActive, setStoryActive] = useState(false);
  const [storyStep, setStoryStep] = useState(0);

  // Set initial selection after mount/seed
  useEffect(() => {
    if (!endowmentId && endowmentPolicies.length > 0) {
      setEndowmentId(endowmentPolicies[0].id);
    }
    if (!healthId && healthPolicies.length > 0) {
      setHealthId(healthPolicies[0].id);
    }
  }, [endowmentPolicies, healthPolicies, endowmentId, healthId]);

  const selectedEndowment = endowmentPolicies.find((p) => p.id === endowmentId) ?? endowmentPolicies[0];
  const selectedHealth = healthPolicies.find((p) => p.id === healthId) ?? healthPolicies[0];

  const result = useMemo(() => {
    if (!selectedEndowment || !selectedHealth) return null;
    return calculateBridge(selectedEndowment, selectedHealth, sensitivity);
  }, [selectedEndowment, selectedHealth, sensitivity]);

  // Story mode: auto-advance every 4 seconds
  useEffect(() => {
    if (!storyActive) return;
    const timer = setTimeout(() => {
      if (storyStep < 3) setStoryStep((s) => s + 1);
      else setStoryActive(false);
    }, 4200);
    return () => clearTimeout(timer);
  }, [storyActive, storyStep]);

  const startStory = useCallback(() => {
    setStoryStep(0);
    setStoryActive(true);
  }, []);

  const stopStory = useCallback(() => {
    setStoryActive(false);
    setStoryStep(0);
  }, []);

  const storySteps = useMemo(() => {
    if (!result || !selectedEndowment || !selectedHealth) return [];
    const yearly = fmtBaht(selectedEndowment.yearlyPremium);
    const years = selectedEndowment.paymentPeriodYears;
    const total = fmtBahtShort(result.endowmentTotalPaid);
    const maturity = fmtBahtShort(result.adjustedMaturityValue);
    const runway = result.healthRunwayAge;
    const coverage = result.yearsOfCoverage;

    return [
      {
        title: "ช่วงที่ 1 — จ่ายเบี้ยสะสมทรัพย์",
        caption: `คุณจ่ายเบี้ยปีละ ${yearly} เป็นเวลา ${years} ปี รวม ${total} เงินเติบโตอยู่ในกรมธรรม์ รอวันครบสัญญา`,
      },
      {
        title: "ช่วงที่ 2 — รับเงินครบสัญญา",
        caption: `อายุ ${result.maturityAge} ปี กรมธรรม์ครบสัญญา คุณได้รับเงิน ${maturity} ก้อนโต เข้าบัญชีในทีเดียว`,
      },
      {
        title: "ช่วงที่ 3 — เงินทำงานแทนคุณ",
        caption: `เงิน ${maturity} นี้จ่ายเบี้ยสุขภาพให้คุณโดยไม่ต้องควักกระเป๋า เงินพอคุ้มครองถึงอายุ ${runway} ปี (${coverage} ปี)`,
      },
      {
        title: "สรุป — Bridge ทำงานอย่างไร",
        caption: `ออมเงิน ${total} → รับ ${maturity} → คุ้มครองสุขภาพ ${coverage} ปี คุ้มค่าไหม? 💡`,
      },
    ];
  }, [result, selectedEndowment, selectedHealth]);

  if (!selectedEndowment || !selectedHealth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">ยังไม่มีกรมธรรม์</p>
        <Button onClick={() => router.push("/insurance/endowment")}>
          + เพิ่มประกันสะสมทรัพย์
        </Button>
      </div>
    );
  }

  const highlightPhase: HighlightPhase = storyActive ? STORY_PHASE_MAP[storyStep] : null;
  const showOutcomeHighlight = storyActive && storyStep === 3;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"
          onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight">Bridge</h1>
          <p className="text-xs text-muted-foreground truncate">
            ใช้เงินสะสมทรัพย์ เป็นเบี้ยสุขภาพ
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          style={{ background: "var(--gold-500)", color: "#fff" }}
          onClick={startStory}
        >
          <Play className="h-3.5 w-3.5" />
          เล่าเรื่อง
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          <h2
            className="text-xl font-bold leading-tight"
            style={{ color: "var(--gold-500)" }}
          >
            Bridge: ใช้เงินสะสมทรัพย์ มาเป็นเบี้ยสุขภาพ
          </h2>
          {result && (
            <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
              เงินสะสมทรัพย์ที่อายุ {result.maturityAge} ปี จะจ่ายค่าเบี้ยสุขภาพได้ถึงอายุ{" "}
              <span className="font-bold" style={{ color: "#2dd4bf" }}>
                {result.healthRunwayAge} ปี
              </span>{" "}
              ({result.yearsOfCoverage} ปี)
            </p>
          )}
        </div>

        {/* Policy selectors */}
        <div
          className="flex gap-3 px-5 py-3 flex-wrap items-center"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">สะสมทรัพย์:</span>
            <select
              value={endowmentId}
              onChange={(e) => setEndowmentId(e.target.value)}
              className="flex-1 min-w-0 text-sm font-medium rounded-lg px-3 outline-none truncate"
              style={{
                height: 40,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {endowmentPolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "ไม่มีชื่อ"} — ฿{p.yearlyPremium.toLocaleString()}/ปี
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">สุขภาพ:</span>
            <select
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              className="flex-1 min-w-0 text-sm font-medium rounded-lg px-3 outline-none truncate"
              style={{
                height: 40,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {healthPolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "ไม่มีชื่อ"} — ถึงอายุ {p.endAge} ปี
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart area */}
        {result && (
          <div className="relative">
            <div className="px-4 pt-4 pb-2">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {/* Legend row */}
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#fb7185" }} />
                    <span className="text-xs text-muted-foreground">เบี้ยสะสมทรัพย์</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#2dd4bf" }} />
                    <span className="text-xs text-muted-foreground">เงินครบสัญญา</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#f43f5e" }} />
                    <span className="text-xs text-muted-foreground">เบี้ยสุขภาพ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-0.5 inline-block" style={{ background: "#2dd4bf" }} />
                    <span className="text-xs text-muted-foreground">เงินคงเหลือ</span>
                  </div>
                </div>

                <BridgeFlowChart result={result} highlightPhase={highlightPhase} />
              </div>
            </div>

            {/* Story mode overlay */}
            {storyActive && storySteps.length > 0 && (
              <div
                className="absolute bottom-6 left-8 right-8 z-10 rounded-xl p-4 shadow-2xl"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1.5px solid var(--gold-500)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.2)",
                }}
              >
                {/* Step dots + close */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStoryStep(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === storyStep ? 20 : 8,
                          height: 8,
                          background: i === storyStep ? "var(--gold-500)" : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={stopStory}
                    className="rounded-full p-1 transition-colors hover:bg-white/10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm font-bold mb-1" style={{ color: "var(--gold-500)" }}>
                  {storySteps[storyStep].title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {storySteps[storyStep].caption}
                </p>

                <div className="flex justify-between items-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={storyStep === 0}
                    onClick={() => setStoryStep((s) => Math.max(0, s - 1))}
                    className="gap-1 h-8 px-2"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ก่อนหน้า
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1 h-8 px-3"
                    style={{ background: "var(--gold-500)", color: "#fff" }}
                    onClick={() => {
                      if (storyStep < 3) setStoryStep((s) => s + 1);
                      else stopStory();
                    }}
                  >
                    {storyStep < 3 ? (
                      <>ถัดไป <ChevronRight className="h-3.5 w-3.5" /></>
                    ) : "เสร็จสิ้น ✓"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outcome cards */}
        {result && (
          <div className="flex gap-3 px-4 pb-4 flex-wrap">
            <OutcomeCard
              label="เบี้ยสะสมทรัพย์รวม"
              value={fmtBahtShort(result.endowmentTotalPaid)}
              sub={`${selectedEndowment.paymentPeriodYears} ปี × ${fmtBahtShort(selectedEndowment.yearlyPremium)}`}
              color="#fb7185"
              highlight={showOutcomeHighlight}
            />
            <OutcomeCard
              label={`เงินคืนที่อายุ ${result.maturityAge} ปี`}
              value={fmtBahtShort(result.adjustedMaturityValue)}
              sub={sensitivity !== 0 ? `${sensitivity > 0 ? "+" : ""}${sensitivity}% จากฐาน` : "จากตารางกรมธรรม์"}
              color="#2dd4bf"
              highlight={showOutcomeHighlight}
            />
            <OutcomeCard
              label="จ่ายเบี้ยสุขภาพได้ถึง"
              value={`อายุ ${result.healthRunwayAge} ปี`}
              sub={`${result.yearsOfCoverage} ปีของการคุ้มครอง`}
              color="#c9a84c"
              highlight={showOutcomeHighlight}
            />
          </div>
        )}

        {/* Sensitivity slider */}
        {result && (
          <div
            className="mx-4 mb-5 rounded-xl px-5 py-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                ปรับมูลค่าที่คาดจะได้รับ
              </p>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: sensitivity === 0 ? "var(--bg-elevated)" : sensitivity > 0 ? "rgba(45,212,191,0.1)" : "rgba(251,113,133,0.1)",
                  color: sensitivity === 0 ? "var(--text-muted)" : sensitivity > 0 ? "#2dd4bf" : "#fb7185",
                  border: `1px solid ${sensitivity === 0 ? "var(--border)" : sensitivity > 0 ? "#2dd4bf44" : "#fb718544"}`,
                }}
              >
                {sensitivity === 0 ? "ตามตาราง" : `${sensitivity > 0 ? "+" : ""}${sensitivity}%`}
              </span>
            </div>

            <input
              type="range"
              value={sensitivity}
              min={-20} max={20} step={5}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ "--slider-fill": `${((sensitivity + 20) / 40) * 100}%` } as React.CSSProperties}
            />

            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>−20% ({fmtBahtShort(result.baseMaturityValue * 0.8)})</span>
              <span>ตามตาราง ({fmtBahtShort(result.baseMaturityValue)})</span>
              <span>+20% ({fmtBahtShort(result.baseMaturityValue * 1.2)})</span>
            </div>
          </div>
        )}

        {/* Insight footer */}
        {result && (
          <div
            className="mx-4 mb-6 rounded-xl px-5 py-4"
            style={{
              border: "1.5px solid var(--gold-500)",
              background: "rgba(201,168,76,0.05)",
              boxShadow: "var(--shadow-glow-gold)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gold-700)" }}>
              สรุป Bridge
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              กรมธรรม์{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {selectedEndowment.name}
              </span>{" "}
              ครบสัญญาที่อายุ {result.maturityAge} ปี ได้รับ{" "}
              <span className="font-bold" style={{ color: "#2dd4bf" }}>
                {fmtBahtShort(result.adjustedMaturityValue)}
              </span>{" "}
              นำมาจ่ายเบี้ยสุขภาพ{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {selectedHealth.name}
              </span>{" "}
              ได้ถึงอายุ{" "}
              <span className="font-bold" style={{ color: "var(--gold-500)" }}>
                {result.healthRunwayAge} ปี
              </span>
              {result.yearsOfCoverage >= 15 ? " — Bridge ทำงานได้ดี ✓" : " — พิจารณาเพิ่มทุนประกัน"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
