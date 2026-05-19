"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitCompare, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScenariosStore } from "@/lib/store/scenarios";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { useGoalsStore } from "@/lib/store/goals";
import { computeScenarioMetrics } from "@/lib/calculations/scenarios";
import dynamic from "next/dynamic";
import { SaveScenarioDialog } from "@/components/scenarios/SaveScenarioDialog";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import type { AppState } from "@/types";

const CompareView = dynamic(
  () => import("@/components/scenarios/CompareView").then((m) => m.CompareView),
  { ssr: false }
);

export default function ScenariosPage() {
  const router = useRouter();
  const { scenarios, saveScenario, deleteScenario } = useScenariosStore();

  // Read current app state from all stores for snapshot
  const {
    assets, liabilities, investments, customExpenses,
    currentAge, name: profileName, monthlyIncome, monthlyExpense,
  } = useBalanceSheetStore();
  const { policies } = useInsuranceStore();
  const { goals } = useGoalsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Precompute metrics for all scenarios
  const scenarioMetrics = useMemo(
    () => Object.fromEntries(scenarios.map((sc) => [sc.id, computeScenarioMetrics(sc.state)])),
    [scenarios]
  );

  function handleSave(name: string) {
    const state: AppState = {
      personal: {
        currentAge: currentAge || 35,
        name: profileName || "",
        monthlyIncome: monthlyIncome || 0,
        monthlyExpense: monthlyExpense || 0,
      },
      insurance: policies,
      assets,
      liabilities,
      investments,
      goals,
      customExpenses: customExpenses || [],
      cashflow: [],
    };
    saveScenario(name, state);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  }

  function handleLoadScenario(id: string) {
    const sc = scenarios.find((s) => s.id === id);
    if (!sc) return;
    const { seed } = useBalanceSheetStore.getState();
    const { loadPolicies } = useInsuranceStore.getState();
    const { loadGoals } = useGoalsStore.getState();

    seed({
      assets: sc.state.assets,
      liabilities: sc.state.liabilities,
      investments: sc.state.investments,
      customExpenses: sc.state.customExpenses ?? [],
      monthlyIncome: sc.state.personal.monthlyIncome,
      monthlyExpense: sc.state.personal.monthlyExpense,
      currentAge: sc.state.personal.currentAge,
      name: sc.state.personal.name,
    });
    loadPolicies(sc.state.insurance);
    loadGoals(sc.state.goals);
    router.push("/demo");
  }

  const compareItems = selectedIds
    .map((id) => {
      const sc = scenarios.find((s) => s.id === id);
      const metrics = scenarioMetrics[id];
      return sc && metrics ? { scenario: sc, metrics } : null;
    })
    .filter(Boolean) as { scenario: (typeof scenarios)[0]; metrics: ReturnType<typeof computeScenarioMetrics> }[];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/demo")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight">Scenarios</h1>
          <p className="text-xs text-muted-foreground">บันทึกและเปรียบเทียบแผนการเงิน</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.length >= 2 && !compareMode && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 gap-1.5 text-xs"
              style={{ border: "1px solid var(--gold-500)", color: "var(--gold-500)" }}
              onClick={() => setCompareMode(true)}
            >
              <GitCompare className="h-4 w-4" />
              เปรียบเทียบ {selectedIds.length}
            </Button>
          )}
          {compareMode && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 gap-1.5 text-xs"
              onClick={() => { setCompareMode(false); setSelectedIds([]); }}
            >
              <X className="h-4 w-4" />
              ปิด
            </Button>
          )}
          <SaveScenarioDialog onSave={handleSave} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {compareMode ? (
          <CompareView items={compareItems} />
        ) : scenarios.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {selectedIds.length > 0 && selectedIds.length < 2 && (
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: "var(--bg-elevated)", color: "var(--gold-500)", border: "1px solid var(--gold-500)33" }}
              >
                เลือก {selectedIds.length}/3 — เลือกอีก {2 - selectedIds.length} เพื่อเปรียบเทียบ
              </div>
            )}
            {selectedIds.length >= 2 && (
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: "var(--bg-elevated)", color: "var(--teal-500)", border: "1px solid var(--teal-500)33" }}
              >
                เลือกแล้ว {selectedIds.length} scenarios — กด &ldquo;เปรียบเทียบ&rdquo; ด้านบน
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((sc) => (
                <ScenarioCard
                  key={sc.id}
                  scenario={sc}
                  metrics={scenarioMetrics[sc.id]!}
                  selected={selectedIds.includes(sc.id)}
                  onToggleSelect={() => toggleSelect(sc.id)}
                  onDelete={() => {
                    deleteScenario(sc.id);
                    setSelectedIds((p) => p.filter((x) => x !== sc.id));
                  }}
                  onLoad={() => handleLoadScenario(sc.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--bg-elevated)" }}
      >
        <Layers className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">ยังไม่มี Scenario</p>
        <p className="text-sm text-muted-foreground mt-1">
          กด &ldquo;บันทึก Scenario&rdquo; เพื่อบันทึกแผนการเงินปัจจุบัน
        </p>
      </div>
    </div>
  );
}
