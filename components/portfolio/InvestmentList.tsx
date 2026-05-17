"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type { InvestmentItem, InvestmentCategory } from "@/types";
import { CAT_COLORS, CAT_LABELS } from "@/lib/calculations/portfolio";

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

const CATEGORIES = Object.keys(CAT_LABELS) as InvestmentCategory[];

interface InvestmentFormState {
  name: string;
  category: InvestmentCategory;
  currentValue: string;
  expectedReturn: number;
  monthlyDCA: string;
}

function emptyForm(): InvestmentFormState {
  return { name: "", category: "fund", currentValue: "", expectedReturn: 7, monthlyDCA: "" };
}

function fromInvestment(inv: InvestmentItem): InvestmentFormState {
  return {
    name: inv.name,
    category: inv.category,
    currentValue: String(inv.currentValue),
    expectedReturn: inv.expectedReturn,
    monthlyDCA: String(inv.monthlyDCA ?? ""),
  };
}

function InvestmentForm({
  initial, onSave, onCancel, onDelete,
}: {
  initial: InvestmentFormState;
  onSave(form: InvestmentFormState): void;
  onCancel(): void;
  onDelete?(): void;
}) {
  const [form, setForm] = useState(initial);
  const update = (patch: Partial<InvestmentFormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
      <input
        className="w-full rounded-lg px-3 h-10 text-sm outline-none"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        placeholder="ชื่อกองทุน / หลักทรัพย์"
        value={form.name}
        onChange={(e) => update({ name: e.target.value })}
      />
      {/* Category buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className="py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              background: form.category === cat ? CAT_COLORS[cat] : "var(--bg-elevated)",
              color: form.category === cat ? "#0a0e1a" : "var(--text-muted)",
              border: `1px solid ${form.category === cat ? CAT_COLORS[cat] : "var(--border)"}`,
            }}
            onClick={() => update({ category: cat })}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>
      {/* Value + DCA */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>มูลค่าปัจจุบัน (฿)</p>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg px-3 h-10 text-sm outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "#2dd4bf" }}
            placeholder="0"
            value={form.currentValue}
            onChange={(e) => update({ currentValue: e.target.value })}
          />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>DCA/เดือน (฿)</p>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg px-3 h-10 text-sm outline-none"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "#60a5fa" }}
            placeholder="0"
            value={form.monthlyDCA}
            onChange={(e) => update({ monthlyDCA: e.target.value })}
          />
        </div>
      </div>
      {/* Return slider */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>ผลตอบแทนคาดหวัง</span>
          <span className="text-sm font-bold" style={{ color: "var(--gold-500)" }}>{form.expectedReturn.toFixed(1)}%/ปี</span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          step={0.5}
          value={form.expectedReturn}
          className="w-full cursor-pointer"
          onChange={(e) => update({ expectedReturn: Number(e.target.value) })}
        />
      </div>
      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
          style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
          onClick={() => onSave(form)}
        >
          <Check className="h-4 w-4" /> บันทึก
        </button>
        <button
          type="button"
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
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
  );
}

interface Props {
  investments: InvestmentItem[];
  onAdd(inv: InvestmentItem): void;
  onUpdate(id: string, updates: Partial<InvestmentItem>): void;
  onRemove(id: string): void;
}

export function InvestmentList({ investments, onAdd, onUpdate, onRemove }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  function handleSave(id: string, form: InvestmentFormState) {
    onUpdate(id, {
      name: form.name,
      category: form.category,
      currentValue: Number(form.currentValue) || 0,
      expectedReturn: form.expectedReturn,
      monthlyDCA: form.monthlyDCA !== "" ? Number(form.monthlyDCA) : undefined,
    });
    setExpandedId(null);
  }

  function handleAdd(form: InvestmentFormState) {
    if (!form.name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      category: form.category,
      currentValue: Number(form.currentValue) || 0,
      expectedReturn: form.expectedReturn,
      monthlyDCA: form.monthlyDCA !== "" ? Number(form.monthlyDCA) : undefined,
    });
    setAdding(false);
  }

  return (
    <div className="mx-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>รายการลงทุน</p>
        <button
          type="button"
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-500)", border: "1px solid rgba(201,168,76,0.3)" }}
          onClick={() => { setAdding(true); setExpandedId(null); }}
        >
          <Plus className="h-3 w-3" /> เพิ่ม
        </button>
      </div>

      <div style={{ background: "var(--bg-elevated)" }}>
        {investments.map((inv, i) => (
          <div key={inv.id}>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 text-left"
              style={{ minHeight: 52, borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
              onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[inv.category] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{inv.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {CAT_LABELS[inv.category]} · {inv.expectedReturn}%
                  {inv.monthlyDCA ? ` · DCA ฿${(inv.monthlyDCA / 1000).toFixed(0)}K` : ""}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums mr-2" style={{ color: "var(--gold-500)" }}>
                {fmtBaht(inv.currentValue)}
              </span>
              {expandedId === inv.id ? (
                <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              )}
            </button>
            {expandedId === inv.id && (
              <InvestmentForm
                initial={fromInvestment(inv)}
                onSave={(form) => handleSave(inv.id, form)}
                onCancel={() => setExpandedId(null)}
                onDelete={() => { onRemove(inv.id); setExpandedId(null); }}
              />
            )}
          </div>
        ))}

        {adding && (
          <div style={{ borderTop: investments.length > 0 ? "1px solid var(--border)" : undefined }}>
            <InvestmentForm
              initial={emptyForm()}
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {investments.length === 0 && !adding && (
          <div className="flex items-center justify-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
            ยังไม่มีการลงทุน — แตะ เพิ่ม เพื่อเริ่ม
          </div>
        )}
      </div>
    </div>
  );
}
