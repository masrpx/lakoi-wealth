"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EndowmentInputPanel } from "@/components/insurance/EndowmentInputPanel";
import { EndowmentChart } from "@/components/insurance/EndowmentChart";
import { useInsuranceStore } from "@/lib/store/insurance";
import { DEMO_ENDOWMENT } from "@/lib/data/demo-data";
import type { EndowmentPolicy } from "@/types/insurance";

function sCashValues(years: number, maturityValue: number): number[] {
  return Array.from({ length: years }, (_, i) => {
    if (i === years - 1) return maturityValue;
    const t = (i + 1) / years;
    return Math.round(maturityValue * t * t * (3 - 2 * t) * 0.55);
  });
}

function blankPolicy(): EndowmentPolicy {
  const years = 20;
  const maturityValue = 1_200_000;
  return {
    id: crypto.randomUUID(),
    type: "endowment",
    name: "",
    startAge: 35,
    yearlyPremium: 50000,
    paymentPeriodYears: years,
    coveragePeriodYears: years,
    sumInsured: maturityValue,
    cashValueByYear: sCashValues(years, maturityValue),
  };
}

const CURRENT_AGE = 35;

export default function EndowmentPage() {
  const router = useRouter();
  const { policies, addPolicy, updatePolicy, removePolicy } = useInsuranceStore();

  const endowmentPolicies = policies.filter(
    (p): p is EndowmentPolicy => ["endowment", "whole_life", "term"].includes(p.type)
  );

  const [draft, setDraft] = useState<EndowmentPolicy>(DEMO_ENDOWMENT);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Seed demo on first visit; always restore demo cash values to fix stale localStorage data
  useEffect(() => {
    if (endowmentPolicies.length === 0) {
      addPolicy(DEMO_ENDOWMENT);
      setSelectedId(DEMO_ENDOWMENT.id);
      setDraft(DEMO_ENDOWMENT);
    } else {
      const demoInStore = endowmentPolicies.find((p) => p.id === DEMO_ENDOWMENT.id);
      if (demoInStore) {
        updatePolicy(DEMO_ENDOWMENT.id, { cashValueByYear: DEMO_ENDOWMENT.cashValueByYear });
      }
      const first = endowmentPolicies[0];
      const restored = first.id === DEMO_ENDOWMENT.id
        ? { ...first, cashValueByYear: DEMO_ENDOWMENT.cashValueByYear }
        : first;
      setSelectedId(first.id);
      setDraft(restored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    const p = endowmentPolicies.find((p) => p.id === id);
    if (p) { setDraft(p); setSelectedId(id); }
  };

  const handleAddNew = () => {
    setDraft(blankPolicy());
    setSelectedId(null);
  };

  const handleSave = () => {
    if (selectedId) {
      updatePolicy(selectedId, draft);
    } else {
      const newPolicy = { ...draft, id: crypto.randomUUID() };
      addPolicy(newPolicy);
      setSelectedId(newPolicy.id);
      setDraft(newPolicy);
    }
  };

  const handleDelete = (id: string) => {
    removePolicy(id);
    const remaining = endowmentPolicies.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      handleSelect(remaining[0].id);
    } else {
      handleAddNew();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => router.push("/demo")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight">ประกันสะสมทรัพย์ / ตลอดชีพ</h1>
          <p className="text-xs text-muted-foreground">Endowment · Whole Life · Term</p>
        </div>
      </header>

      {/* Two-column body */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Left: Input panel — 40% on landscape */}
        <div
          className="lg:w-[40%] shrink-0 border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "var(--border)" }}
        >
          <EndowmentInputPanel
            draft={draft}
            savedPolicies={endowmentPolicies}
            selectedId={selectedId}
            onChange={setDraft}
            onSave={handleSave}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
            onDelete={handleDelete}
          />
        </div>

        {/* Right: Visualization — 60% on landscape */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <EndowmentChart policy={draft} currentAge={CURRENT_AGE} />
        </div>
      </div>
    </div>
  );
}
