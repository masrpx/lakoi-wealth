"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { aggregateMonthlyCashflowV2, aggregateYearlyCashflowV2 } from "@/lib/calculations/cashflow";
import { demoData } from "@/lib/data/demo-data";
import { CashflowChart } from "@/components/cashflow/CashflowChart";
import {
  IncomeSection, LivingSection, InsuranceSection,
  InvestmentSection, DebtSection, CustomExpenseSection,
} from "@/components/cashflow/CashflowSections";
import { NetSavingsBar } from "@/components/cashflow/NetSavingsBar";
import type { CustomExpenseItem } from "@/types";

type CashflowView = "monthly" | "yearly";

export default function CashflowPage() {
  const router = useRouter();
  const [view, setView] = useState<CashflowView>("monthly");

  const {
    assets, liabilities, monthlyIncome, monthlyExpense, currentAge,
    investments, customExpenses, seed, setInvestments,
    updateInvestmentDCA, addCustomExpense, removeCustomExpense, updateCustomExpense,
  } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();

  useEffect(() => {
    if (assets.length === 0 && liabilities.length === 0) {
      seed({
        assets: demoData.assets,
        liabilities: demoData.liabilities,
        monthlyIncome: 150000,
        monthlyExpense: 80000,
        currentAge: 35,
        investments: demoData.investments,
      });
    }
    if (investments.length === 0) setInvestments(demoData.investments);
    if (policies.length === 0) loadPolicies(demoData.insurance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chartInput = useMemo(() => ({
    profile: { currentAge: currentAge || 35, monthlyIncome: monthlyIncome || 150000, monthlyExpense: monthlyExpense || 80000 },
    insurances: policies,
    investments,
    liabilities,
    customExpenses,
  }), [currentAge, monthlyIncome, monthlyExpense, policies, investments, liabilities, customExpenses]);

  const monthlyPoint = useMemo(() => aggregateMonthlyCashflowV2(chartInput)[0], [chartInput]);
  const yearlyData = useMemo(() => aggregateYearlyCashflowV2(chartInput, 30), [chartInput]);

  const currentPoint = view === "monthly" ? monthlyPoint : yearlyData[0];
  const totalExpenses = (currentPoint?.livingExpense ?? 0) +
    (currentPoint?.insurancePremium ?? 0) +
    (currentPoint?.investmentDCA ?? 0) +
    (currentPoint?.debtPayment ?? 0) +
    (currentPoint?.customExpenseTotal ?? 0);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
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
          <p className="text-xs text-muted-foreground">รายรับ · รายจ่าย · เงินออม</p>
        </div>
        {/* Toggle */}
        <div className="flex rounded-xl overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          {(["monthly", "yearly"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === v ? "var(--gold-500)" : "transparent",
                color: view === v ? "#0a0e1a" : "var(--text-muted)",
              }}
              onClick={() => setView(v)}
            >
              {v === "monthly" ? "รายเดือน" : "รายปี"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <CashflowChart monthlyPoint={monthlyPoint} yearlyData={yearlyData} view={view} />

        <div className="px-4 space-y-3 pt-2 pb-4">
          <IncomeSection
            monthlyIncome={monthlyIncome || 150000}
            view={view}
            onEdit={() => router.push("/profile")}
          />
          <LivingSection
            monthlyExpense={monthlyExpense || 80000}
            view={view}
            onEdit={() => router.push("/profile")}
          />
          <InsuranceSection
            policies={policies}
            currentAge={currentAge || 35}
            view={view}
          />
          <InvestmentSection
            investments={investments}
            view={view}
            onUpdateDCA={updateInvestmentDCA}
          />
          <DebtSection liabilities={liabilities} view={view} />
          <CustomExpenseSection
            items={customExpenses}
            view={view}
            onAdd={(item) => addCustomExpense({ ...item, id: crypto.randomUUID() } as CustomExpenseItem)}
            onRemove={removeCustomExpense}
            onUpdate={updateCustomExpense}
          />
        </div>
      </div>

      <NetSavingsBar
        totalIncome={currentPoint?.income ?? 0}
        totalExpenses={totalExpenses}
        net={currentPoint?.net ?? 0}
        view={view}
        onEdit={() => router.push("/profile")}
      />
    </div>
  );
}
