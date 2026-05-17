"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitLinkInputPanel } from "@/components/insurance/UnitLinkInputPanel";
import { UnitLinkLifetimeChart } from "@/components/insurance/UnitLinkLifetimeChart";
import { useInsuranceStore } from "@/lib/store/insurance";
import { DEMO_UL } from "@/lib/data/demo-data";
import type { UnitLinkPolicy } from "@/types/insurance";

function blankPolicy(): UnitLinkPolicy {
  return {
    id: crypto.randomUUID(),
    type: "unit_link",
    name: "",
    startAge: 35,
    regularYearlyPremium: 100000,
    paymentPeriodYears: 25,
    sumInsured: 1_000_000,
    initialTopUp: 0,
    recurringTopUp: 0,
    adHocTopUps: [],
    expectedReturn: 7,
    costOfInsurance: 1.5,
    withdrawals: null,
  };
}

export default function UnitLinkPage() {
  const router = useRouter();
  const { policies, addPolicy, updatePolicy, removePolicy } = useInsuranceStore();

  const ulPolicies = policies.filter((p): p is UnitLinkPolicy => p.type === "unit_link");

  const [draft, setDraft] = useState<UnitLinkPolicy>(DEMO_UL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (ulPolicies.length === 0) {
      addPolicy(DEMO_UL);
      setSelectedId(DEMO_UL.id);
      setDraft(DEMO_UL);
    } else {
      const demoInStore = ulPolicies.find((p) => p.id === DEMO_UL.id);
      if (demoInStore) {
        updatePolicy(DEMO_UL.id, DEMO_UL);
      }
      const first = ulPolicies[0];
      const restored = first.id === DEMO_UL.id ? { ...DEMO_UL } : first;
      setSelectedId(first.id);
      setDraft(restored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    const p = ulPolicies.find((p) => p.id === id);
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
    const remaining = ulPolicies.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      handleSelect(remaining[0].id);
    } else {
      handleAddNew();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight">ยูนิตลิงค์</h1>
          <p className="text-xs text-muted-foreground">Unit Link · Investment-linked insurance</p>
        </div>
      </header>

      {/* Input panel — full width accordion */}
      <div
        className="shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <UnitLinkInputPanel
          draft={draft}
          savedPolicies={ulPolicies}
          selectedId={selectedId}
          onChange={setDraft}
          onSave={handleSave}
          onSelect={handleSelect}
          onAddNew={handleAddNew}
          onDelete={handleDelete}
        />
      </div>

      {/* Chart — full width below */}
      <div className="flex-1">
        <UnitLinkLifetimeChart policy={draft} targetAge={0} />
      </div>
    </div>
  );
}
