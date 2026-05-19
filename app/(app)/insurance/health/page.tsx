"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthInputPanel } from "@/components/insurance/HealthInputPanel";
import { HealthChart } from "@/components/insurance/HealthChart";
import { useInsuranceStore } from "@/lib/store/insurance";
import { DEMO_HEALTH } from "@/lib/data/demo-data";
import type { HealthPolicy } from "@/types/insurance";

function blankPolicy(): HealthPolicy {
  return {
    id: crypto.randomUUID(),
    type: "health",
    name: "",
    startAge: 35,
    endAge: 99,
    sumInsured: 1_000_000,
    yearlyPremiumByAge: {},
  };
}

const CURRENT_AGE = 35;

export default function HealthPage() {
  const router = useRouter();
  const { policies, addPolicy, updatePolicy, removePolicy } = useInsuranceStore();

  const healthPolicies = policies.filter((p): p is HealthPolicy => p.type === "health");

  const [draft, setDraft] = useState<HealthPolicy>(DEMO_HEALTH);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (healthPolicies.length === 0) {
      addPolicy(DEMO_HEALTH);
      setSelectedId(DEMO_HEALTH.id);
      setDraft(DEMO_HEALTH);
    } else {
      const demoInStore = healthPolicies.find((p) => p.id === DEMO_HEALTH.id);
      if (demoInStore) {
        updatePolicy(DEMO_HEALTH.id, { yearlyPremiumByAge: DEMO_HEALTH.yearlyPremiumByAge });
      }
      const first = healthPolicies[0];
      const restored =
        first.id === DEMO_HEALTH.id
          ? { ...first, yearlyPremiumByAge: DEMO_HEALTH.yearlyPremiumByAge }
          : first;
      setSelectedId(first.id);
      setDraft(restored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    const p = healthPolicies.find((p) => p.id === id);
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
    const remaining = healthPolicies.filter((p) => p.id !== id);
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
          <h1 className="text-base font-semibold leading-tight">ประกันสุขภาพ</h1>
          <p className="text-xs text-muted-foreground">Health Insurance · เบี้ยตามอายุ</p>
        </div>
      </header>

      {/* Two-column body */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Left: Input panel — 40% on landscape */}
        <div
          className="lg:w-[40%] shrink-0 border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "var(--border)" }}
        >
          <HealthInputPanel
            draft={draft}
            savedPolicies={healthPolicies}
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
          <HealthChart policy={draft} currentAge={CURRENT_AGE} />
        </div>
      </div>
    </div>
  );
}
