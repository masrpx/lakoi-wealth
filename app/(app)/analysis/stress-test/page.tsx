"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { demoData } from "@/lib/data/demo-data";
import { projectNetWorth } from "@/lib/calculations/netWorth";

function fmtY(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return "฿0";
}

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${Math.round(abs).toLocaleString("th-TH")}`;
}

const SCENARIOS = [
  {
    key: "base",
    label: "ฐาน",
    color: "var(--gold-500)",
    desc: "ไม่มีการเปลี่ยนแปลง",
  },
  {
    key: "crash",
    label: "ตลาดร่วง 30%",
    color: "#fb7185",
    desc: "มูลค่าการลงทุนลด 30% ทันที พร้อมผลตอบแทนระยะยาวลดลง",
  },
  {
    key: "inflation",
    label: "เงินเฟ้อสูง 5%",
    color: "#f59e0b",
    desc: "ค่าใช้จ่ายเพิ่มขึ้น 25% จากเงินเฟ้อที่สูงกว่าคาด",
  },
  {
    key: "jobLoss",
    label: "ตกงาน 6 เดือน",
    color: "#a78bfa",
    desc: "ใช้เงินสำรอง 6 เดือนในการดำรงชีวิต",
  },
];

export default function StressTestPage() {
  const router = useRouter();
  const {
    assets, liabilities, monthlyIncome, monthlyExpense, currentAge,
    propertyGrowthRate, goldGrowthRate, investments, seed, setInvestments,
  } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35, investments: demoData.investments });
    }
    if (investments.length === 0) setInvestments(demoData.investments);
    if (policies.length === 0) loadPolicies(demoData.insurance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = currentAge || 35;
  const profile = useMemo(() => ({
    currentAge: age,
    monthlyIncome: monthlyIncome || 150000,
    monthlyExpense: monthlyExpense || 80000,
    propertyGrowthRate: propertyGrowthRate ?? 3,
    goldGrowthRate: goldGrowthRate ?? 0,
  }), [age, monthlyIncome, monthlyExpense, propertyGrowthRate, goldGrowthRate]);

  const chartData = useMemo(() => {
    const base = projectNetWorth(profile, assets, liabilities, policies, investments, 30);

    // Scenario 1: market crash — investments drop 30%, blended return reduced
    const crashInvestments = investments.map((inv) => ({
      ...inv,
      currentValue: inv.currentValue * 0.7,
      expectedReturn: inv.expectedReturn * 0.6,
    }));
    const crash = projectNetWorth(profile, assets, liabilities, policies, crashInvestments, 30);

    // Scenario 2: high inflation — monthly expense 25% higher
    const inflationProfile = { ...profile, monthlyExpense: profile.monthlyExpense * 1.25 };
    const inflation = projectNetWorth(inflationProfile, assets, liabilities, policies, investments, 30);

    // Scenario 3: job loss — reduce cash by 6 months of expenses upfront
    const jobLossAssets = assets.map((a) =>
      a.category === "cash"
        ? { ...a, value: Math.max(0, a.value - profile.monthlyExpense * 6) }
        : a
    );
    const jobLoss = projectNetWorth(profile, jobLossAssets, liabilities, policies, investments, 30);

    return base.map((b, i) => ({
      age: b.age,
      base: Math.round(b.netWorth),
      crash: Math.round(crash[i]?.netWorth ?? 0),
      inflation: Math.round(inflation[i]?.netWorth ?? 0),
      jobLoss: Math.round(jobLoss[i]?.netWorth ?? 0),
    }));
  }, [profile, assets, liabilities, policies, investments]);

  const xTicks = chartData.filter((_, i) => i % 5 === 0).map((d) => d.age);
  const finalRow = chartData[chartData.length - 1];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">ทดสอบความเครียด</h1>
          <p className="text-xs text-muted-foreground">จำลองสถานการณ์เลวร้าย 3 แบบ</p>
        </div>
        <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#f59e0b" }} />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Chart */}
        <div className="px-4 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="age" ticks={xTicks} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmtY} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={56} />
              <Tooltip
                formatter={(v, name) => [fmtBaht(Number(v)), SCENARIOS.find((s) => s.key === name)?.label ?? name]}
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => SCENARIOS.find((s) => s.key === v)?.label ?? v} />
              <Line dataKey="base" stroke="var(--gold-500)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line dataKey="crash" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
              <Line dataKey="inflation" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
              <Line dataKey="jobLoss" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario impact cards */}
        <div className="px-4 space-y-3 pb-4">
          {SCENARIOS.slice(1).map((s) => {
            const final = finalRow?.[s.key as keyof typeof finalRow] as number ?? 0;
            const base = finalRow?.base ?? 0;
            const impact = final - base;
            const pct = base > 0 ? (impact / base) * 100 : 0;
            return (
              <div key={s.key} className="rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{fmtBaht(final)}</p>
                    <p className="text-xs" style={{ color: "#fb7185" }}>{pct.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
