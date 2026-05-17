"use client";

import { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import type { Goal, GoalType } from "@/types";
import { GoalIcon } from "./GoalCard";

interface Props {
  initial?: Partial<Goal>;
  isNew?: boolean;
  onSave(goal: Omit<Goal, "id">): void;
  onCancel(): void;
  onDelete?(): void;
}

const GOAL_TYPES: { type: GoalType; label: string }[] = [
  { type: "retirement",   label: "เกษียณ" },
  { type: "education",    label: "การศึกษา" },
  { type: "down_payment", label: "ดาวน์บ้าน" },
  { type: "custom",       label: "อื่น ๆ" },
];

export function GoalForm({ initial, isNew, onSave, onCancel, onDelete }: Props) {
  const [type, setType] = useState<GoalType>(initial?.type ?? "retirement");
  const [name, setName] = useState(initial?.name ?? "");
  const [targetAge, setTargetAge] = useState(initial?.targetAge ?? 60);
  const [targetYear, setTargetYear] = useState(initial?.targetYear ?? new Date().getFullYear() + 10);
  const [targetAmount, setTargetAmount] = useState(String(initial?.targetAmount ?? ""));
  const [monthlyAmountAfter, setMonthlyAmountAfter] = useState(String(initial?.monthlyAmountAfter ?? "80000"));
  const [inflationRate, setInflationRate] = useState(initial?.inflationRate ?? 3);

  function handleSave() {
    const base = { type, name: name || GOAL_TYPES.find((t) => t.type === type)!.label };
    if (type === "retirement") {
      onSave({
        ...base,
        targetAge,
        targetAmount: 0,
        monthlyAmountAfter: Number(monthlyAmountAfter) || 80000,
        inflationRate,
      });
    } else {
      onSave({
        ...base,
        targetYear,
        targetAmount: Number(targetAmount) || 0,
      });
    }
  }

  return (
    <div className="mx-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 space-y-3" style={{ background: "var(--bg-elevated)" }}>
        {/* Type selector (only for new goals) */}
        {isNew && (
          <div className="grid grid-cols-4 gap-1.5">
            {GOAL_TYPES.map(({ type: t, label }) => (
              <button
                key={t}
                type="button"
                className="py-2 text-xs font-medium rounded-lg flex flex-col items-center gap-1 transition-all"
                style={{
                  background: type === t ? "rgba(201,168,76,0.2)" : "var(--bg-surface)",
                  border: `1px solid ${type === t ? "var(--gold-500)" : "var(--border)"}`,
                  color: type === t ? "var(--gold-500)" : "var(--text-muted)",
                }}
                onClick={() => setType(t)}
              >
                <GoalIcon type={t} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Name */}
        <input
          className="w-full rounded-lg px-3 h-10 text-sm outline-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          placeholder="ชื่อเป้าหมาย"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Retirement-specific fields */}
        {type === "retirement" && (
          <>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>ต้องการเงิน/เดือนหลังเกษียณ (฿)</p>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg px-3 h-10 text-sm outline-none"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "#2dd4bf" }}
                value={monthlyAmountAfter}
                onChange={(e) => setMonthlyAmountAfter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>อายุเกษียณ</p>
              <div className="flex items-center gap-2">
                <button type="button" className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--gold-500)" }}
                  onClick={() => setTargetAge((a) => Math.max(50, a - 1))}>−</button>
                <span className="w-10 text-center text-sm font-bold" style={{ color: "var(--gold-500)" }}>{targetAge}</span>
                <button type="button" className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--gold-500)" }}
                  onClick={() => setTargetAge((a) => Math.min(75, a + 1))}>+</button>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>อัตราเงินเฟ้อ</span>
                <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{inflationRate.toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={5} step={0.5} value={inflationRate}
                className="w-full cursor-pointer"
                onChange={(e) => setInflationRate(Number(e.target.value))} />
            </div>
          </>
        )}

        {/* Non-retirement fields */}
        {type !== "retirement" && (
          <>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>จำนวนเงินเป้าหมาย (฿)</p>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg px-3 h-10 text-sm outline-none"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "#2dd4bf" }}
                placeholder="2,000,000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>ปีเป้าหมาย (ค.ศ.)</p>
              <input
                type="number"
                min={new Date().getFullYear() + 1}
                max={2080}
                className="w-full rounded-lg px-3 h-10 text-sm outline-none"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "#60a5fa" }}
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
            style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
            onClick={handleSave}
          >
            <Check className="h-4 w-4" /> บันทึก
          </button>
          <button
            type="button"
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              type="button"
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-elevated)", border: "1px solid #fb718544", color: "#fb7185" }}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
