"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { useGoalsStore } from "@/lib/store/goals";
import { demoData } from "@/lib/data/demo-data";
import { projectNetWorth, findCrossoverAge } from "@/lib/calculations/netWorth";
import { calcGoalResult } from "@/lib/calculations/goals";
import {
  portfolioTotalValue, portfolioWeightedReturn, portfolioTotalDCA,
} from "@/lib/calculations/portfolio";
import { GoalIcon } from "@/components/goals/GoalCard";

function fmtY(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return `฿0`;
}

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

const BAR_LABELS: Record<string, string> = {
  cash: "เงินสด", property: "อสังหาฯ", investment: "ลงทุน",
  gold: "ทอง", insuranceCashValue: "ประกัน", other: "อื่น ๆ",
  liabilities: "หนี้สิน", netWorth: "มั่งคั่งสุทธิ", totalDeathCoverage: "คุ้มครองชีวิต",
};

type TEntry = { name: string; value: number; color: string; dataKey: string };

function NWTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs shadow-lg space-y-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>อายุ {label} ปี</p>
      {payload.filter((p) => Math.abs(p.value ?? 0) > 0).map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {BAR_LABELS[p.dataKey] ?? p.name}: {fmtBaht(p.value)}
        </p>
      ))}
    </div>
  );
}

function sliderFill(v: number, min: number, max: number) {
  return { "--slider-fill": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

export default function PortfolioProjectionPage() {
  const router = useRouter();
  const [extraDCA, setExtraDCA] = useState(0);
  const [showGoals, setShowGoals] = useState(true);

  const {
    assets, liabilities, monthlyIncome, monthlyExpense, currentAge,
    propertyGrowthRate, goldGrowthRate, investments, seed, setInvestments,
  } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();
  const { goals, loadGoals } = useGoalsStore();

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35, investments: demoData.investments });
    }
    if (investments.length === 0) setInvestments(demoData.investments);
    if (policies.length === 0) loadPolicies(demoData.insurance);
    if (goals.length === 0) loadGoals(demoData.goals);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = currentAge || 35;
  const currentYear = new Date().getFullYear();

  const modifiedInvestments = useMemo(() =>
    investments.map((inv) => ({
      ...inv,
      monthlyDCA: (inv.monthlyDCA ?? 0) + (extraDCA / Math.max(1, investments.length)),
    })),
    [investments, extraDCA]
  );

  const profile = useMemo(() => ({
    currentAge: age,
    monthlyIncome: monthlyIncome || 150000,
    monthlyExpense: monthlyExpense || 80000,
    propertyGrowthRate: propertyGrowthRate ?? 3,
    goldGrowthRate: goldGrowthRate ?? 0,
  }), [age, monthlyIncome, monthlyExpense, propertyGrowthRate, goldGrowthRate]);

  const projection = useMemo(
    () => projectNetWorth(profile, assets, liabilities, policies, modifiedInvestments, 30),
    [profile, assets, liabilities, policies, modifiedInvestments]
  );

  const crossoverAge = useMemo(() => findCrossoverAge(projection), [projection]);

  const goalResults = useMemo(() =>
    goals.map((g) => calcGoalResult(
      g, age, currentYear,
      portfolioTotalValue(modifiedInvestments),
      portfolioWeightedReturn(modifiedInvestments),
      portfolioTotalDCA(modifiedInvestments)
    )),
    [goals, age, currentYear, modifiedInvestments]
  );

  const xTicks = useMemo(
    () => projection.filter((_, i) => i % 5 === 0).map((p) => p.age),
    [projection]
  );

  const finalNW = projection[projection.length - 1]?.netWorth ?? 0;
  const currentNW = projection[0]?.netWorth ?? 0;
  const growthMultiple = currentNW > 0 ? (finalNW / currentNW).toFixed(1) : "—";

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">ภาพรวมความมั่งคั่ง</h1>
          <p className="text-xs text-muted-foreground">ทุกสินทรัพย์ + เป้าหมายในที่เดียว</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg shrink-0 transition-all"
          style={{
            background: showGoals ? "rgba(45,212,191,0.15)" : "var(--bg-elevated)",
            border: `1px solid ${showGoals ? "#2dd4bf44" : "var(--border)"}`,
            color: showGoals ? "#2dd4bf" : "var(--text-muted)",
          }}
          onClick={() => setShowGoals((s) => !s)}
        >
          เป้าหมาย {showGoals ? "●" : "○"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* DCA Sensitivity slider */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>เพิ่มออม</span>
            <span className="text-sm font-bold" style={{ color: extraDCA > 0 ? "#2dd4bf" : "var(--text-muted)" }}>
              {extraDCA > 0 ? `+${fmtBaht(extraDCA)}/เดือน` : "ไม่มีการเพิ่ม"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={extraDCA}
            className="w-full cursor-pointer"
            style={sliderFill(extraDCA, 0, 50000)}
            onChange={(e) => setExtraDCA(Number(e.target.value))}
          />
          {extraDCA > 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              หากออมเพิ่ม {fmtBaht(extraDCA)}/เดือน กระจายใน {modifiedInvestments.length} กองทุน
            </p>
          )}
        </div>

        {/* Wealth chart */}
        <div className="px-4 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={projection} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
              <XAxis
                dataKey="age"
                ticks={xTicks}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtY}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={<NWTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "var(--text-muted)" }}
                formatter={(v: string) => BAR_LABELS[v] ?? v}
              />
              <Bar dataKey="cash"               stackId="nw" fill="#60a5fa" isAnimationActive={false} />
              <Bar dataKey="property"           stackId="nw" fill="#c9a84c" isAnimationActive={false} />
              <Bar dataKey="investment"         stackId="nw" fill="#2dd4bf" isAnimationActive={false} />
              <Bar dataKey="gold"               stackId="nw" fill="#f59e0b" isAnimationActive={false} />
              <Bar dataKey="insuranceCashValue" stackId="nw" fill="#a78bfa" isAnimationActive={false} />
              <Bar dataKey="other"              stackId="nw" fill="#94a3b8" isAnimationActive={false} />
              <Bar dataKey="liabilities"        stackId="nw" fill="#fb7185" fillOpacity={0.55} isAnimationActive={false} />
              <Line type="monotone" dataKey="netWorth" stroke="var(--gold-500)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="stepAfter" dataKey="totalDeathCoverage" stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="8 4" dot={false} isAnimationActive={false} />
              {/* Goal reference lines */}
              {showGoals && goalResults.map((gr) => {
                if (!gr.targetAge) return null;
                return (
                  <ReferenceLine
                    key={gr.goalId}
                    x={gr.targetAge}
                    stroke={gr.isOnTrack ? "#2dd4bf" : "#fb7185"}
                    strokeDasharray="4 4"
                    label={{
                      value: gr.name.slice(0, 8),
                      position: "insideTopLeft",
                      fontSize: 9,
                      fill: gr.isOnTrack ? "#2dd4bf" : "#fb7185",
                    }}
                  />
                );
              })}
              {crossoverAge !== null && (
                <ReferenceLine
                  x={crossoverAge}
                  stroke="var(--gold-500)"
                  strokeDasharray="3 3"
                  label={{ value: "ทรัพย์สินเกินคุ้มครอง", position: "insideTopRight", fontSize: 9, fill: "var(--gold-500)" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Death coverage crossover insight */}
        {crossoverAge !== null && (
          <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl text-xs" style={{ background: "#c9a84c18", border: "1px solid #c9a84c44" }}>
            <span style={{ color: "var(--gold-500)" }}>
              อายุ {crossoverAge} ปี: ความมั่งคั่งสุทธิเกินความคุ้มครองชีวิต
            </span>
          </div>
        )}

        {/* Goal status cards */}
        {goalResults.length > 0 && (
          <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                สถานะเป้าหมาย
              </p>
            </div>
            <div style={{ background: "var(--bg-elevated)" }}>
              {goalResults.map((gr, i) => (
                <div
                  key={gr.goalId}
                  className="flex items-center gap-3 px-4"
                  style={{ minHeight: 52, borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                >
                  <GoalIcon type={gr.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{gr.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      คาดการณ์ {fmtBaht(gr.currentTrajectory)} · เป้า {fmtBaht(gr.corpusNeeded)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{
                      background: gr.isOnTrack ? "#2dd4bf22" : "#fb718522",
                      color: gr.isOnTrack ? "#2dd4bf" : "#fb7185",
                    }}
                  >
                    {gr.isOnTrack ? "✓ บรรลุ" : `+${fmtBaht(gr.requiredMonthlySavings)}/เดือน`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-5 py-3 flex items-center gap-4"
        style={{
          background: "var(--bg-elevated)",
          borderTop: "1.5px solid var(--gold-500)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gold-500)" }}>
            ในอีก 30 ปี
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            มั่งคั่งสุทธิ{" "}
            <span className="font-bold" style={{ color: "var(--gold-500)" }}>{fmtBaht(finalNW)}</span>
            {" "}· เพิ่มขึ้น{" "}
            <span className="font-bold" style={{ color: "#2dd4bf" }}>{growthMultiple}×</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs shrink-0"
          style={{ color: "var(--text-muted)" }}
          onClick={() => router.push("/portfolio")}
        >
          แก้ไขพอร์ต →
        </Button>
      </div>
    </div>
  );
}
