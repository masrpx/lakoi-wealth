"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { demoData } from "@/lib/data/demo-data";
import {
  portfolioAllocation, portfolioWeightedReturn,
  portfolioTotalValue, portfolioTotalDCA,
} from "@/lib/calculations/portfolio";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { GrowthTable } from "@/components/portfolio/GrowthTable";
import { InvestmentList } from "@/components/portfolio/InvestmentList";

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

export default function PortfolioPage() {
  const router = useRouter();
  const {
    investments, currentAge, setInvestments,
    addInvestment, updateInvestment, removeInvestment,
  } = useBalanceSheetStore();

  useEffect(() => {
    if (investments.length === 0) setInvestments(demoData.investments);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalValue = useMemo(() => portfolioTotalValue(investments), [investments]);
  const weightedReturn = useMemo(() => portfolioWeightedReturn(investments), [investments]);
  const totalDCA = useMemo(() => portfolioTotalDCA(investments), [investments]);
  const allocations = useMemo(() => portfolioAllocation(investments), [investments]);
  const age = currentAge || 35;

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
        <div>
          <h1 className="text-base font-semibold leading-tight">พอร์ตการลงทุน</h1>
          <p className="text-xs text-muted-foreground">จัดการกองทุนและสินทรัพย์ลงทุน</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* KPI row */}
        <div
          className="grid grid-cols-3 gap-2 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">มูลค่ารวม</p>
            <p className="text-base font-bold" style={{ color: "var(--gold-500)" }}>{fmtBaht(totalValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">ผลตอบแทน (ถ่วงน้ำหนัก)</p>
            <p className="text-lg font-bold font-display" style={{ color: "#2dd4bf" }}>{weightedReturn.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">DCA/เดือน</p>
            <p className="text-base font-bold" style={{ color: "#60a5fa" }}>{fmtBaht(totalDCA)}</p>
          </div>
        </div>

        {/* Allocation pie */}
        {allocations.length > 0 && (
          <AllocationChart allocations={allocations} totalValue={totalValue} />
        )}

        {/* Growth projection table */}
        <div className="mt-3">
          <GrowthTable investments={investments} currentAge={age} />
        </div>

        {/* Investment list */}
        <div className="mt-3">
          <InvestmentList
            investments={investments}
            onAdd={addInvestment}
            onUpdate={updateInvestment}
            onRemove={removeInvestment}
          />
        </div>
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
            {investments.length} รายการ
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            มูลค่า <span className="font-bold" style={{ color: "var(--gold-500)" }}>{fmtBaht(totalValue)}</span>
            {" "}· DCA <span className="font-bold" style={{ color: "#60a5fa" }}>{fmtBaht(totalDCA)}/เดือน</span>
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs gap-1.5"
          style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
          onClick={() => router.push("/use-cases/portfolio-projection")}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          ภาพรวม
        </Button>
      </div>
    </div>
  );
}
