"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { demoData } from "@/lib/data/demo-data";

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${Math.round(abs).toLocaleString("th-TH")}`;
}

const TARGET_MONTHS = 6;
const WARNING_MONTHS = 3;

function statusFor(months: number): { label: string; color: string; bg: string } {
  if (months >= TARGET_MONTHS) return { label: "ดีเยี่ยม", color: "#2dd4bf", bg: "rgba(45,212,191,0.08)" };
  if (months >= WARNING_MONTHS) return { label: "พอใช้", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" };
  return { label: "ไม่เพียงพอ", color: "#fb7185", bg: "rgba(251,113,133,0.08)" };
}

export default function EmergencyFundPage() {
  const router = useRouter();
  const { assets, monthlyExpense, seed } = useBalanceSheetStore();

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    const liquid = assets.filter((a) => a.category === "cash").reduce((s, a) => s + a.value, 0);
    const expense = monthlyExpense || 1;
    const runway = liquid / expense;
    const target = expense * TARGET_MONTHS;
    const shortfall = Math.max(0, target - liquid);
    const pct = Math.min(100, (runway / TARGET_MONTHS) * 100);
    return { liquid, expense, runway, target, shortfall, pct };
  }, [assets, monthlyExpense]);

  const status = statusFor(result.runway);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">กองทุนฉุกเฉิน</h1>
          <p className="text-xs text-muted-foreground">เงินสดสำรองรองรับเหตุฉุกเฉิน</p>
        </div>
        <Wallet className="h-5 w-5 shrink-0" style={{ color: status.color }} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 space-y-4">
        {/* Status card */}
        <div className="rounded-xl p-4" style={{ background: status.bg, border: `1px solid ${status.color}44` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: status.color }}>
            {status.label} — {result.runway.toFixed(1)} เดือน
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            เป้าหมาย {TARGET_MONTHS} เดือน
            {result.shortfall > 0 ? ` · ขาดอีก ${fmtBaht(result.shortfall)}` : " · คุณทำได้แล้ว!"}
          </p>
        </div>

        {/* Gauge */}
        <div className="rounded-xl px-4 py-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>0 เดือน</span>
            <span className="font-semibold" style={{ color: status.color }}>{result.runway.toFixed(1)} เดือน</span>
            <span>{TARGET_MONTHS} เดือน</span>
          </div>
          <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            {/* Warning zone: 3–6 months */}
            <div className="absolute top-0 left-[50%] h-full w-[50%]" style={{ background: "rgba(245,158,11,0.2)" }} />
            {/* Good zone: 6+ months (edge marker) */}
            <div className="absolute top-0 h-full w-0.5 left-[100%]" style={{ background: "#2dd4bf" }} />
            {/* Progress */}
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${result.pct}%`, background: status.color }} />
          </div>
          <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <span></span>
            <span style={{ color: "#f59e0b" }}>3 เดือน</span>
            <span></span>
          </div>
        </div>

        {/* KPI row */}
        {[
          { label: "เงินสดและเงินฝาก", value: result.liquid, color: "#60a5fa" },
          { label: "รายจ่ายต่อเดือน", value: result.expense, color: "var(--text-primary)" },
          { label: "เป้าหมาย 6 เดือน", value: result.target, color: "var(--gold-500)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex justify-between items-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color }}>{fmtBaht(value)}</span>
          </div>
        ))}

        {result.shortfall > 0 && (
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--gold-500)" }}>แนะนำ</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ออมเพิ่ม <span style={{ color: "var(--gold-500)", fontWeight: 700 }}>{fmtBaht(Math.ceil(result.shortfall / 12))}/เดือน</span>{" "}
              เป็นเวลา 12 เดือน เพื่อสร้างกองทุนฉุกเฉินให้ครบ {TARGET_MONTHS} เดือน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
