"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { demoData } from "@/lib/data/demo-data";
import { simulateDebtPayoff, DEFAULT_RATES, type DebtItem } from "@/lib/calculations/debt";

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function sliderFill(v: number, min: number, max: number) {
  return { "--slider-fill": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

export default function DebtPage() {
  const router = useRouter();
  const { liabilities, currentAge, assets, seed } = useBalanceSheetStore();
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraPayment, setExtraPayment] = useState(0);

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = currentAge || 35;

  const debts = useMemo<DebtItem[]>(() =>
    liabilities.map((l) => ({
      id: l.id,
      name: l.name,
      balance: l.totalAmount,
      monthlyPayment: l.monthlyPayment,
      annualRate: l.interestRate ?? DEFAULT_RATES[l.category] ?? 7,
    })),
    [liabilities]
  );

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);

  const baseResult = useMemo(() => simulateDebtPayoff(debts, strategy, 0, age), [debts, strategy, age]);
  const extraResult = useMemo(() => simulateDebtPayoff(debts, strategy, extraPayment, age), [debts, strategy, extraPayment, age]);

  const avalancheResult = useMemo(() => simulateDebtPayoff(debts, "avalanche", extraPayment, age), [debts, extraPayment, age]);
  const snowballResult = useMemo(() => simulateDebtPayoff(debts, "snowball", extraPayment, age), [debts, extraPayment, age]);

  const monthsSaved = baseResult.months - extraResult.months;
  const interestSaved = baseResult.totalInterest - extraResult.totalInterest;

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CreditCard className="h-10 w-10 mb-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>ไม่มีหนี้สิน</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>← กลับ</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">กลยุทธ์ชำระหนี้</h1>
          <p className="text-xs text-muted-foreground">Avalanche vs Snowball</p>
        </div>
        <CreditCard className="h-5 w-5 shrink-0" style={{ color: "#fb7185" }} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 space-y-4">
        {/* Strategy toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["avalanche", "snowball"] as const).map((s) => (
            <button key={s} type="button" className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: strategy === s ? "#fb718520" : "var(--bg-elevated)",
                color: strategy === s ? "#fb7185" : "var(--text-muted)",
                borderRight: s === "avalanche" ? "1px solid var(--border)" : undefined,
              }}
              onClick={() => setStrategy(s)}>
              {s === "avalanche" ? "Avalanche (ดอกเบี้ยสูงก่อน)" : "Snowball (ยอดน้อยก่อน)"}
            </button>
          ))}
        </div>

        {/* Strategy comparison */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Avalanche", result: avalancheResult, color: "#fb7185" },
            { label: "Snowball", result: snowballResult, color: "#f59e0b" },
          ].map(({ label, result: r, color }) => (
            <div key={label} className="rounded-xl px-3 py-3 text-center"
              style={{ background: "var(--bg-elevated)", border: strategy === label.toLowerCase() ? `1px solid ${color}` : "1px solid var(--border)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
              <p className="text-base font-black" style={{ color }}>{r.months} เดือน</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>ดอกเบี้ย {fmtBaht(r.totalInterest)}</p>
            </div>
          ))}
        </div>

        {/* Extra payment slider */}
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>จ่ายเพิ่มต่อเดือน</span>
            <span className="text-sm font-bold" style={{ color: extraPayment > 0 ? "#2dd4bf" : "var(--text-muted)" }}>
              {extraPayment > 0 ? `+${fmtBaht(extraPayment)}` : "ไม่มีการจ่ายเพิ่ม"}
            </span>
          </div>
          <input type="range" min={0} max={50000} step={1000} value={extraPayment}
            className="w-full cursor-pointer" style={sliderFill(extraPayment, 0, 50000)}
            onChange={(e) => setExtraPayment(Number(e.target.value))} />
          {extraPayment > 0 && (
            <p className="text-xs mt-1.5" style={{ color: "#2dd4bf" }}>
              ประหยัดเวลา {monthsSaved} เดือน · ประหยัดดอกเบี้ย {fmtBaht(interestSaved)}
            </p>
          )}
        </div>

        {/* KPI row */}
        {[
          { label: "หนี้สินรวม", value: fmtBaht(totalDebt), color: "#fb7185" },
          { label: "ชำระ/เดือน", value: fmtBaht(totalMonthly), color: "var(--text-primary)" },
          { label: "ปลอดหนี้อายุ", value: `${extraResult.debtFreeAge} ปี`, color: "#2dd4bf" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex justify-between items-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color }}>{value}</span>
          </div>
        ))}

        {/* Debt list with rates */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ลำดับการชำระ ({strategy === "avalanche" ? "ดอกเบี้ยสูงก่อน" : "ยอดน้อยก่อน"})</p>
          </div>
          <div style={{ background: "var(--bg-elevated)" }}>
            {extraResult.payoffOrder.map((name, i) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold"
                  style={{ background: "rgba(251,113,133,0.2)", color: "#fb7185" }}>{i + 1}</span>
                <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
