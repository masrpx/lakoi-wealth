"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { projectNetWorth, findCrossoverAge } from "@/lib/calculations/netWorth";
import { demoData } from "@/lib/data/demo-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtY(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return `฿0`;
}

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  cash: "เงินสด/ฝาก",
  property: "อสังหาฯ",
  investment: "ลงทุน",
  gold: "ทองคำ",
  insuranceCashValue: "มูลค่ากรมธรรม์",
  other: "อื่น ๆ",
  liabilities: "หนี้สิน",
  netWorth: "ความมั่งคั่งสุทธิ",
  totalDeathCoverage: "คุ้มครองชีวิตรวม",
};

type TEntry = { name: string; value: number; color: string; dataKey: string };

function NWTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => Math.abs(p.value ?? 0) > 0);
  return (
    <div className="rounded-lg p-3 text-xs shadow-lg space-y-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>อายุ {label} ปี</p>
      {nonZero.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {CAT_LABELS[p.dataKey] ?? p.name}: {fmtBaht(p.value)}
        </p>
      ))}
      <p className="text-xs pt-1 border-t" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
        แตะเพื่อดู snapshot งบดุล
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function NetWorthPage() {
  const router = useRouter();

  const {
    assets, liabilities, monthlyIncome, monthlyExpense, currentAge,
    propertyGrowthRate, goldGrowthRate, seed,
  } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();

  // Seed demo data if stores are empty
  useEffect(() => {
    if (assets.length === 0 && liabilities.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
    if (policies.length === 0) {
      loadPolicies(demoData.insurance);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = useMemo(() => ({
    currentAge: currentAge || 35,
    monthlyIncome: monthlyIncome || 150000,
    monthlyExpense: monthlyExpense || 80000,
    propertyGrowthRate: propertyGrowthRate ?? 3,
    goldGrowthRate: goldGrowthRate ?? 0,
  }), [currentAge, monthlyIncome, monthlyExpense, propertyGrowthRate, goldGrowthRate]);

  const projection = useMemo(
    () => projectNetWorth(profile, assets, liabilities, policies, demoData.investments, 30),
    [profile, assets, liabilities, policies]
  );

  const crossoverAge = useMemo(() => findCrossoverAge(projection), [projection]);

  const currentNW = projection[0]?.netWorth ?? 0;
  const finalNW = projection[projection.length - 1]?.netWorth ?? 0;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiab = liabilities.reduce((s, l) => s + l.totalAmount, 0);
  const growthMultiple = currentNW > 0 ? (finalNW / currentNW).toFixed(1) : "—";

  const xTicks = useMemo(
    () => projection.filter((_, i) => i % 5 === 0).map((p) => p.age),
    [projection]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight">ความมั่งคั่งสุทธิ</h1>
          <p className="text-xs text-muted-foreground">การเติบโตของทรัพย์สินในอีก 30 ปี</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* KPI Row */}
        <div
          className="grid grid-cols-3 gap-2 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">สินทรัพย์ปัจจุบัน</p>
            <p className="text-base font-bold" style={{ color: "#2dd4bf" }}>{fmtBaht(totalAssets)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">มั่งคั่งสุทธิวันนี้</p>
            <p className="text-lg font-bold font-display" style={{ color: "var(--gold-500)" }}>
              {fmtBaht(currentNW)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">หนี้สินปัจจุบัน</p>
            <p className="text-base font-bold" style={{ color: "#fb7185" }}>{fmtBaht(totalLiab)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            แตะแถบใดก็ได้เพื่อดู snapshot งบดุล ณ อายุนั้น
          </p>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
              data={projection}
              margin={{ top: 16, right: 12, left: 0, bottom: 4 }}
            >
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
                formatter={(v: string) => CAT_LABELS[v] ?? v}
              />

              {/* Stacked asset bars — onClick on each bar fires with the full data row */}
              <Bar dataKey="cash"               stackId="nw" fill="#60a5fa" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="property"           stackId="nw" fill="#c9a84c" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="investment"         stackId="nw" fill="#2dd4bf" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="gold"               stackId="nw" fill="#f59e0b" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="insuranceCashValue" stackId="nw" fill="#a78bfa" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="other"              stackId="nw" fill="#94a3b8" isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />
              <Bar dataKey="liabilities"        stackId="nw" fill="#fb7185" fillOpacity={0.55} isAnimationActive={false} cursor="pointer" onClick={(d) => router.push(`/balance-sheet?snapshot=${(d as unknown as { age: number }).age}`)} />

              {/* Net worth line */}
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="var(--gold-500)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />

              {/* Total death coverage — dashed gold */}
              <Line
                type="stepAfter"
                dataKey="totalDeathCoverage"
                stroke="#c9a84c"
                strokeWidth={1.5}
                strokeDasharray="8 4"
                dot={false}
                isAnimationActive={false}
              />

              {/* Crossover annotation */}
              {crossoverAge !== null && (
                <ReferenceLine
                  x={crossoverAge}
                  stroke="var(--gold-500)"
                  strokeDasharray="3 3"
                  label={{
                    value: "ทรัพย์สินเกินคุ้มครอง",
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: "var(--gold-500)",
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Death coverage insight */}
        {crossoverAge !== null && (
          <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl text-xs" style={{ background: "#c9a84c18", border: "1px solid #c9a84c44" }}>
            <span style={{ color: "var(--gold-500)" }}>
              อายุ {crossoverAge} ปี: ความมั่งคั่งสุทธิเกินความคุ้มครองชีวิต —
              คุณสร้างทรัพย์สินได้มากกว่าที่ประกันจะจ่ายให้ครอบครัว
            </span>
          </div>
        )}
      </div>

      {/* Sticky bottom insight */}
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
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
          onClick={() => router.push("/profile")}
        >
          แก้ไขข้อมูล →
        </Button>
      </div>
    </div>
  );
}
