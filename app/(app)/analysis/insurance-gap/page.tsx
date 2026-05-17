"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { demoData } from "@/lib/data/demo-data";
import type { EndowmentPolicy, UnitLinkPolicy } from "@/types/insurance";

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${n < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function sliderFill(v: number, min: number, max: number) {
  return { "--slider-fill": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

export default function InsuranceGapPage() {
  const router = useRouter();
  const { assets, liabilities, monthlyExpense, seed } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();
  const [protectionYears, setProtectionYears] = useState(25);

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
    if (policies.length === 0) loadPolicies(demoData.insurance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analysis = useMemo(() => {
    const totalDebt = liabilities.reduce((s, l) => s + l.totalAmount, 0);
    const incomeReplacement = monthlyExpense * 12 * protectionYears;
    const familyNeed = totalDebt + incomeReplacement;

    // Life coverage: endowment + unit_link sum insured (health is not life coverage)
    let lifeCoverage = 0;
    for (const p of policies) {
      if (p.type === "endowment" || p.type === "whole_life" || p.type === "term") {
        lifeCoverage += (p as EndowmentPolicy).sumInsured;
      }
      if (p.type === "unit_link") {
        lifeCoverage += (p as UnitLinkPolicy).sumInsured;
      }
    }

    const gap = familyNeed - lifeCoverage;
    const coverageRatio = familyNeed > 0 ? (lifeCoverage / familyNeed) * 100 : 0;

    return { totalDebt, incomeReplacement, familyNeed, lifeCoverage, gap, coverageRatio };
  }, [liabilities, monthlyExpense, policies, protectionYears]);

  const isAdequate = analysis.gap <= 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">ความคุ้มครองชีวิต</h1>
          <p className="text-xs text-muted-foreground">ตรวจสอบช่องว่างความคุ้มครอง</p>
        </div>
        <ShieldAlert className="h-5 w-5 shrink-0" style={{ color: isAdequate ? "#2dd4bf" : "#fb7185" }} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 space-y-4">
        {/* Protection years slider */}
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>ระยะเวลาคุ้มครอง</span>
            <span className="text-sm font-bold" style={{ color: "var(--gold-500)" }}>{protectionYears} ปี</span>
          </div>
          <input type="range" min={10} max={40} step={1} value={protectionYears}
            className="w-full cursor-pointer" style={sliderFill(protectionYears, 10, 40)}
            onChange={(e) => setProtectionYears(Number(e.target.value))} />
        </div>

        {/* Coverage status */}
        <div className="rounded-xl p-4" style={{
          background: isAdequate ? "rgba(45,212,191,0.08)" : "rgba(251,113,133,0.08)",
          border: `1px solid ${isAdequate ? "#2dd4bf44" : "#fb718544"}`,
        }}>
          <p className="text-sm font-semibold mb-1" style={{ color: isAdequate ? "#2dd4bf" : "#fb7185" }}>
            {isAdequate ? "✓ ความคุ้มครองเพียงพอ" : "⚠ ความคุ้มครองไม่เพียงพอ"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {isAdequate
              ? `คุ้มครองเกินความต้องการ ${fmtBaht(Math.abs(analysis.gap))}`
              : `ขาดความคุ้มครองอีก ${fmtBaht(analysis.gap)}`}
          </p>
        </div>

        {/* KPI grid */}
        {[
          { label: "ความต้องการครอบครัว", value: analysis.familyNeed, color: "var(--text-primary)" },
          { label: "หนี้สินทั้งหมด", value: analysis.totalDebt, color: "#fb7185" },
          { label: "ทดแทนรายได้ครัวเรือน", value: analysis.incomeReplacement, color: "#fb7185" },
          { label: "ความคุ้มครองชีวิตปัจจุบัน", value: analysis.lifeCoverage, color: "#2dd4bf" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex justify-between items-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color }}>{fmtBaht(value)}</span>
          </div>
        ))}

        {/* Coverage bar */}
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>อัตราความคุ้มครอง</span>
            <span className="text-xs font-bold" style={{ color: isAdequate ? "#2dd4bf" : "#fb7185" }}>
              {analysis.coverageRatio.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analysis.coverageRatio).toFixed(1)}%`, background: isAdequate ? "#2dd4bf" : "#fb7185" }} />
          </div>
        </div>

        {!isAdequate && (
          <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
            แนะนำ: พิจารณาซื้อ Term Life หรือเพิ่มทุนประกันชีวิต {fmtBaht(analysis.gap)} เพื่อคุ้มครองครอบครัว
          </p>
        )}
      </div>
    </div>
  );
}
