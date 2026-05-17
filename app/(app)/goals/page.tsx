"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useGoalsStore } from "@/lib/store/goals";
import { demoData } from "@/lib/data/demo-data";
import { calcGoalResult } from "@/lib/calculations/goals";
import {
  portfolioTotalValue, portfolioWeightedReturn, portfolioTotalDCA,
} from "@/lib/calculations/portfolio";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import type { Goal } from "@/types";

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

export default function GoalsPage() {
  const router = useRouter();
  const { investments, currentAge } = useBalanceSheetStore();
  const { goals, loadGoals, addGoal, updateGoal, removeGoal } = useGoalsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (goals.length === 0) loadGoals(demoData.goals);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = currentAge || 35;
  const currentYear = new Date().getFullYear();
  const portfolioValue = useMemo(() => portfolioTotalValue(investments), [investments]);
  const blendedReturn = useMemo(() => portfolioWeightedReturn(investments), [investments]);
  const monthlyDCA = useMemo(() => portfolioTotalDCA(investments), [investments]);

  const goalResults = useMemo(
    () => goals.map((g) => calcGoalResult(g, age, currentYear, portfolioValue, blendedReturn, monthlyDCA)),
    [goals, age, currentYear, portfolioValue, blendedReturn, monthlyDCA]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">เป้าหมายทางการเงิน</h1>
          <p className="text-xs text-muted-foreground">ติดตามความคืบหน้าสู่เป้าหมาย</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg shrink-0"
          style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-500)", border: "1px solid rgba(201,168,76,0.3)" }}
          onClick={() => { setAdding(true); setEditingId(null); }}
        >
          <Plus className="h-3.5 w-3.5" /> เพิ่ม
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pt-4">
        {/* Portfolio context banner */}
        <div
          className="mx-4 mb-4 px-4 py-2.5 rounded-xl text-xs"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            พอร์ตปัจจุบัน{" "}
            <span className="font-semibold" style={{ color: "var(--gold-500)" }}>{fmtBaht(portfolioValue)}</span>
            {" "}· ผลตอบแทน{" "}
            <span className="font-semibold" style={{ color: "#2dd4bf" }}>{blendedReturn.toFixed(1)}%/ปี</span>
            {" "}· DCA{" "}
            <span className="font-semibold" style={{ color: "#60a5fa" }}>{fmtBaht(monthlyDCA)}/เดือน</span>
          </span>
        </div>

        {/* Add form */}
        {adding && (
          <div className="mb-4">
            <GoalForm
              isNew
              onSave={(g) => {
                addGoal({ ...g, id: crypto.randomUUID() } as Goal);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {/* Goal cards */}
        <div className="space-y-4">
          {goalResults.map((result, i) => {
            const goal = goals[i];
            if (!goal) return null;
            if (editingId === goal.id) {
              return (
                <GoalForm
                  key={goal.id}
                  initial={goal}
                  onSave={(updates) => { updateGoal(goal.id, updates); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => { removeGoal(goal.id); setEditingId(null); }}
                />
              );
            }
            return (
              <GoalCard
                key={goal.id}
                result={result}
                onEdit={() => { setEditingId(goal.id); setAdding(false); }}
              />
            );
          })}
        </div>

        {goals.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>ยังไม่มีเป้าหมาย</p>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-500)", border: "1px solid rgba(201,168,76,0.3)" }}
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" /> เพิ่มเป้าหมายแรก
            </button>
          </div>
        )}

        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            className="w-full py-2.5 rounded-xl text-sm"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            onClick={() => router.push("/use-cases/portfolio-projection")}
          >
            ดูภาพรวมความมั่งคั่ง →
          </button>
        </div>
      </div>
    </div>
  );
}
