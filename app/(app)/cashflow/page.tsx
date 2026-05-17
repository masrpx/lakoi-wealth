"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import {
  aggregateMonthlyCashflow,
  aggregateYearlyCashflow,
  type CashflowMonthPoint,
  type CashflowYearPoint,
} from "@/lib/calculations/cashflow";
import { demoData } from "@/lib/data/demo-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtY(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${v}`;
}

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function fmtFull(n: number): string {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

type TEntry = { name: string; value: number; color: string; dataKey: string };

function CashflowTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));

  return (
    <div className="rounded-lg p-3 text-xs shadow-lg space-y-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>
        {typeof label === "number" ? `อายุ ${label} ปี` : label}
      </p>
      {(byKey.income ?? 0) > 0 && <p style={{ color: "#2dd4bf" }}>รายได้: {fmtFull(byKey.income)}</p>}
      {(byKey.policyReturns ?? 0) > 0 && <p style={{ color: "#c9a84c" }}>คืนเงิน/ถอน: {fmtFull(byKey.policyReturns)}</p>}
      {Math.abs(byKey.livingExpense ?? 0) > 0 && <p style={{ color: "#fb7185" }}>ค่าใช้จ่าย: {fmtFull(Math.abs(byKey.livingExpense ?? 0))}</p>}
      {Math.abs(byKey.insurancePremium ?? 0) > 0 && <p style={{ color: "#f43f5e" }}>เบี้ยประกัน: {fmtFull(Math.abs(byKey.insurancePremium ?? 0))}</p>}
      {Math.abs(byKey.investmentDCA ?? 0) > 0 && <p style={{ color: "#60a5fa" }}>DCA: {fmtFull(Math.abs(byKey.investmentDCA ?? 0))}</p>}
      <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
      <p style={{ color: "var(--gold-500)" }}>สะสม: {fmtFull(byKey.cumulative ?? 0)}</p>
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function CashflowChart({
  monthly,
  yearly,
  view,
}: {
  monthly: CashflowMonthPoint[];
  yearly: CashflowYearPoint[];
  view: "monthly" | "yearly";
}) {
  type ChartRow = {
    x: string | number;
    income: number;
    policyReturns?: number;
    livingExpense: number;
    insurancePremium: number;
    investmentDCA: number;
    cumulative: number;
  };

  const data = useMemo((): ChartRow[] => {
    if (view === "monthly") {
      return monthly.map((d) => ({
        x: d.label,
        income: d.income,
        livingExpense: -d.livingExpense,
        insurancePremium: -d.insurancePremium,
        investmentDCA: d.investmentDCA > 0 ? -d.investmentDCA : 0,
        cumulative: d.cumulative,
      }));
    }
    return yearly.map((d) => ({
      x: d.age,
      income: d.income,
      policyReturns: d.policyReturns > 0 ? d.policyReturns : 0,
      livingExpense: -d.livingExpense,
      insurancePremium: d.insurancePremium > 0 ? -d.insurancePremium : 0,
      investmentDCA: d.investmentDCA > 0 ? -d.investmentDCA : 0,
      cumulative: d.cumulative,
    }));
  }, [monthly, yearly, view]);

  const xTicks = useMemo(() => {
    if (view === "monthly") return undefined;
    return yearly.filter((_, i) => i % 5 === 0).map((d) => d.age);
  }, [view, yearly]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
        <XAxis
          dataKey="x"
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
        <Tooltip content={<CashflowTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "var(--text-muted)" }}
          formatter={(v: string) => ({
            income: "รายได้",
            policyReturns: "คืนเงิน/ถอน",
            livingExpense: "ค่าใช้จ่าย",
            insurancePremium: "เบี้ยประกัน",
            investmentDCA: "DCA",
            cumulative: "สะสม",
          }[v] ?? v)}
        />

        {/* Positive stacks */}
        <Bar dataKey="income" stackId="cf" fill="#2dd4bf" fillOpacity={0.85} isAnimationActive={false} />
        {view === "yearly" && (
          <Bar dataKey="policyReturns" stackId="cf" fill="#c9a84c" isAnimationActive={false} />
        )}

        {/* Negative stacks */}
        <Bar dataKey="livingExpense" stackId="cf" fill="#fb7185" fillOpacity={0.75} isAnimationActive={false} />
        <Bar dataKey="insurancePremium" stackId="cf" fill="#f43f5e" fillOpacity={0.75} isAnimationActive={false} />
        {view === "yearly" && (
          <Bar dataKey="investmentDCA" stackId="cf" fill="#60a5fa" fillOpacity={0.75} isAnimationActive={false} />
        )}

        {/* Cumulative savings line */}
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="var(--gold-500)"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Breakdown Panel ───────────────────────────────────────────────────────────

function BreakdownPanel({
  monthly,
  yearly,
  view,
}: {
  monthly: CashflowMonthPoint[];
  yearly: CashflowYearPoint[];
  view: "monthly" | "yearly";
}) {
  const [open, setOpen] = useState(false);

  const m = monthly[0];
  const totalYearlyPremium = yearly[0]?.insurancePremium ?? 0;

  // Notable return events from yearly data
  const returnEvents = useMemo(
    () => yearly.filter((y) => y.policyReturns > 0).slice(0, 8),
    [yearly]
  );

  return (
    <div className="mx-4 mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <button
        type="button"
        className="w-full flex items-center px-4 py-3 gap-2"
        style={{ background: "var(--bg-surface)" }}
        onClick={() => setOpen((o) => !o)}
      >
        <p className="text-xs font-semibold uppercase tracking-wider flex-1 text-left" style={{ color: "var(--text-muted)" }}>
          รายละเอียดกระแสเงิน
        </p>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: "var(--bg-elevated)" }}>
          {view === "monthly" && m && (
            <>
              <Row label="รายได้/เดือน" value={fmtFull(m.income)} color="#2dd4bf" />
              <Row label="ค่าใช้จ่าย/เดือน" value={fmtFull(m.livingExpense)} color="#fb7185" neg />
              <Row label="เบี้ยประกันรวม/เดือน" value={fmtFull(m.insurancePremium)} color="#f43f5e" neg />
              {m.investmentDCA > 0 && <Row label="DCA/เดือน" value={fmtFull(m.investmentDCA)} color="#60a5fa" neg />}
              <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
                <Row label="กระแสเงินสุทธิ/เดือน" value={fmtFull(m.net)} color={m.net >= 0 ? "#2dd4bf" : "#fb7185"} />
                <Row label="สะสมสิ้นปี" value={fmtFull(m.net * 12)} color="var(--gold-500)" />
              </div>
            </>
          )}

          {view === "yearly" && (
            <>
              <Row label="รายได้/ปี" value={fmtBaht(yearly[0]?.income ?? 0)} color="#2dd4bf" />
              <Row label="ค่าใช้จ่าย/ปี" value={fmtBaht(yearly[0]?.livingExpense ?? 0)} color="#fb7185" neg />
              <Row label="เบี้ยประกันรวม/ปี (ปีแรก)" value={fmtBaht(totalYearlyPremium)} color="#f43f5e" neg />

              {returnEvents.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--gold-500)" }}>คืนเงิน / ถอนจากกรมธรรม์</p>
                  {returnEvents.map((y) =>
                    y.returnItems.map((item) => (
                      <Row
                        key={`${y.age}-${item.policyName}`}
                        label={`อายุ ${y.age}: ${item.policyName}`}
                        value={fmtBaht(item.amount)}
                        color="#c9a84c"
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, neg = false }: { label: string; value: string; color: string; neg?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color }}>{neg ? "−" : ""}{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CashflowPage() {
  const router = useRouter();
  const [view, setView] = useState<"monthly" | "yearly">("yearly");

  const { monthlyIncome, monthlyExpense, currentAge, setProfile, assets, liabilities, seed } =
    useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();

  // Seed stores if empty
  useEffect(() => {
    if (assets.length === 0 && liabilities.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
    if (policies.length === 0) {
      loadPolicies(demoData.insurance);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const income = monthlyIncome || 150000;
  const expense = monthlyExpense || 80000;
  const age = currentAge || 35;

  const profile = useMemo(() => ({ currentAge: age, monthlyIncome: income, monthlyExpense: expense }), [age, income, expense]);
  const investments = useMemo(() => demoData.investments, []);

  const monthlyData = useMemo(
    () => aggregateMonthlyCashflow(profile, policies, investments),
    [profile, policies, investments]
  );
  const yearlyData = useMemo(
    () => aggregateYearlyCashflow(profile, policies, investments, 30),
    [profile, policies, investments]
  );

  const monthlyNet = monthlyData[0]?.net ?? 0;
  const totalCumulative = (view === "monthly" ? monthlyData : yearlyData).at(-1)?.cumulative ?? 0;
  const lowestPoint = Math.min(...(view === "yearly" ? yearlyData : monthlyData).map((d) => d.cumulative));

  return (
    <div className="flex flex-col min-h-screen bg-background pb-8">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">กระแสเงินสด</h1>
          <p className="text-xs text-muted-foreground">รายได้ · รายจ่าย · ประกัน · คืนเงิน</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["monthly", "yearly"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === v ? "var(--gold-500)" : "var(--bg-elevated)",
                color: view === v ? "#000" : "var(--text-muted)",
              }}
              onClick={() => setView(v)}
            >
              {v === "monthly" ? "รายเดือน" : "รายปี"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile inputs */}
        <div
          className="grid grid-cols-3 gap-3 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          <ProfileInput
            label="รายได้/เดือน"
            value={income}
            color="#2dd4bf"
            onChange={(v) => setProfile(v, expense, age)}
          />
          <ProfileInput
            label="ค่าใช้จ่าย/เดือน"
            value={expense}
            color="#fb7185"
            onChange={(v) => setProfile(income, v, age)}
          />
          <ProfileInput
            label="อายุปัจจุบัน"
            value={age}
            color="var(--gold-500)"
            suffix="ปี"
            onChange={(v) => setProfile(income, expense, v)}
          />
        </div>

        {/* Chart */}
        <div className="px-4 pt-4 pb-2">
          <CashflowChart monthly={monthlyData} yearly={yearlyData} view={view} />
        </div>

        {/* Summary card */}
        <div className="mx-4 mb-4 rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gold-500)" }}>
            สรุปกระแสเงิน
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">สุทธิ/เดือน</p>
              <p className="text-base font-bold" style={{ color: monthlyNet >= 0 ? "#2dd4bf" : "#fb7185" }}>
                {fmtBaht(monthlyNet)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {view === "monthly" ? "สะสมสิ้นปี" : "สะสมปีที่ 30"}
              </p>
              <p className="text-base font-bold" style={{ color: totalCumulative >= 0 ? "var(--gold-500)" : "#fb7185" }}>
                {fmtBaht(totalCumulative)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {view === "yearly" ? "จุดต่ำสุด" : "ออมได้/ปี"}
              </p>
              <p className="text-base font-bold" style={{ color: lowestPoint >= 0 ? "#2dd4bf" : "#fb7185" }}>
                {view === "yearly" ? fmtBaht(lowestPoint) : fmtBaht(monthlyNet * 12)}
              </p>
            </div>
          </div>

          {view === "yearly" && lowestPoint < 0 && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "#fb718520", color: "#fb7185" }}>
              ⚠ กระแสเงินสุทธิติดลบในบางปี — พิจารณาปรับแผนเบี้ยหรือถอนเงิน
            </p>
          )}
          {view === "yearly" && lowestPoint >= 0 && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "#2dd4bf15", color: "#2dd4bf" }}>
              ✓ กระแสเงินสุทธิเป็นบวกตลอด 30 ปี
            </p>
          )}
        </div>

        {/* Breakdown */}
        <BreakdownPanel monthly={monthlyData} yearly={yearlyData} view={view} />
      </div>
    </div>
  );
}

// ── Profile Input ─────────────────────────────────────────────────────────────

function ProfileInput({
  label,
  value,
  color,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => { setLocal(String(value)); }, [value]);

  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex items-center gap-1">
        {!suffix && <span className="text-xs" style={{ color }}>฿</span>}
        <input
          type="number"
          className="w-full rounded-md px-2 h-9 text-sm font-semibold outline-none"
          style={{ background: "var(--bg-elevated)", border: `1px solid var(--border)`, color }}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { const n = Number(local); if (!isNaN(n) && n > 0) onChange(n); }}
        />
        {suffix && <span className="text-xs shrink-0" style={{ color }}>{suffix}</span>}
      </div>
    </div>
  );
}
