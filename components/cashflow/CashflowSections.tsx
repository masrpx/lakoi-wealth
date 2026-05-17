"use client";

import { useState } from "react";
import { ChevronRight, Trash2, Plus, Check } from "lucide-react";
import type { InsurancePolicy } from "@/types/insurance";
import type { InvestmentItem, Liability, CustomExpenseItem } from "@/types";
import { yearlyPremiumForPolicy } from "@/lib/calculations/cashflow";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function multiply(n: number, view: "monthly" | "yearly") {
  return view === "yearly" ? n * 12 : n;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title, accentColor, children,
}: {
  title: string; accentColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
      </div>
      <div style={{ background: "var(--bg-elevated)" }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  name, amount, color, subtitle, suffix, action,
}: {
  name: string; amount: number; color: string;
  subtitle?: string; suffix?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{ minHeight: 44, borderTop: "1px solid var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
        {subtitle && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {suffix}
      {action && <div className="shrink-0">{action}</div>}
      {!action && (
        <p className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>
          {fmtBaht(amount)}
        </p>
      )}
    </div>
  );
}

// ── Income Section ────────────────────────────────────────────────────────────

export function IncomeSection({
  monthlyIncome, view, onEdit,
}: {
  monthlyIncome: number; view: "monthly" | "yearly"; onEdit: () => void;
}) {
  return (
    <Section title="รายรับ" accentColor="#2dd4bf">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4"
        style={{ minHeight: 44 }}
        onClick={onEdit}
      >
        <p className="flex-1 text-sm text-left" style={{ color: "var(--text-primary)" }}>เงินเดือน / รายได้</p>
        <p className="text-sm font-bold tabular-nums" style={{ color: "#2dd4bf" }}>
          {fmtBaht(multiply(monthlyIncome, view))}
        </p>
        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
      </button>
    </Section>
  );
}

// ── Living Expenses Section ───────────────────────────────────────────────────

export function LivingSection({
  monthlyExpense, view, onEdit,
}: {
  monthlyExpense: number; view: "monthly" | "yearly"; onEdit: () => void;
}) {
  return (
    <Section title="ค่าครองชีพ" accentColor="#fb7185">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4"
        style={{ minHeight: 44 }}
        onClick={onEdit}
      >
        <p className="flex-1 text-sm text-left" style={{ color: "var(--text-primary)" }}>ค่าใช้จ่ายรายเดือน</p>
        <p className="text-sm font-bold tabular-nums" style={{ color: "#fb7185" }}>
          -{fmtBaht(multiply(monthlyExpense, view))}
        </p>
        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
      </button>
    </Section>
  );
}

// ── Insurance Section ─────────────────────────────────────────────────────────

export function InsuranceSection({
  policies, currentAge, view,
}: {
  policies: InsurancePolicy[]; currentAge: number; view: "monthly" | "yearly";
}) {
  const active = policies.filter((p) => yearlyPremiumForPolicy(p, currentAge) > 0);
  if (active.length === 0) return null;

  return (
    <Section title="เบี้ยประกันภัย" accentColor="#a78bfa">
      {active.map((policy) => {
        const yearly = yearlyPremiumForPolicy(policy, currentAge);
        const amount = view === "monthly" ? yearly / 12 : yearly;
        return (
          <Row
            key={policy.id}
            name={policy.name}
            subtitle={view === "yearly" ? `฿${(yearly / 1000).toFixed(0)}K/ปี` : `฿${(yearly / 12 / 1000).toFixed(1)}K/เดือน`}
            amount={amount}
            color="#a78bfa"
          />
        );
      })}
    </Section>
  );
}

// ── Investment DCA Section ────────────────────────────────────────────────────

function DCARow({
  investment, view, onUpdate,
}: {
  investment: InvestmentItem; view: "monthly" | "yearly"; onUpdate: (id: string, v: number) => void;
}) {
  const [local, setLocal] = useState(String(investment.monthlyDCA ?? 0));

  const monthly = investment.monthlyDCA ?? 0;
  const display = view === "yearly" ? monthly * 12 : monthly;

  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{ minHeight: 44, borderTop: "1px solid var(--border)" }}
    >
      <p className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>{investment.name}</p>
      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
        {view === "yearly" ? "฿/ปี" : "฿/เดือน"}
      </span>
      <input
        type="number"
        min={0}
        className="w-24 rounded-lg px-2 h-8 text-sm font-semibold text-right outline-none"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "#60a5fa" }}
        value={view === "yearly" ? Number(local) * 12 : local}
        onChange={(e) => {
          const raw = view === "yearly" ? String(Math.round(Number(e.target.value) / 12)) : e.target.value;
          setLocal(raw);
        }}
        onBlur={() => {
          const n = Number(local);
          if (!isNaN(n) && n >= 0) onUpdate(investment.id, n);
        }}
      />
      {display > 0 && (
        <p className="text-sm font-bold tabular-nums shrink-0 w-20 text-right" style={{ color: "#60a5fa" }}>
          -{fmtBaht(display)}
        </p>
      )}
    </div>
  );
}

export function InvestmentSection({
  investments, view, onUpdateDCA,
}: {
  investments: InvestmentItem[]; view: "monthly" | "yearly";
  onUpdateDCA: (id: string, monthlyDCA: number) => void;
}) {
  if (investments.length === 0) return null;
  return (
    <Section title="ลงทุน (DCA)" accentColor="#60a5fa">
      {investments.map((inv) => (
        <DCARow key={inv.id} investment={inv} view={view} onUpdate={onUpdateDCA} />
      ))}
    </Section>
  );
}

// ── Debt Section ──────────────────────────────────────────────────────────────

export function DebtSection({
  liabilities, view,
}: {
  liabilities: Liability[]; view: "monthly" | "yearly";
}) {
  const active = liabilities.filter((l) => l.monthlyPayment > 0);
  if (active.length === 0) return null;
  return (
    <Section title="ชำระหนี้สิน" accentColor="#f59e0b">
      {active.map((l) => (
        <Row
          key={l.id}
          name={l.name}
          subtitle={`เหลือ ${fmtBaht(l.totalAmount)}`}
          amount={multiply(l.monthlyPayment, view)}
          color="#f59e0b"
        />
      ))}
    </Section>
  );
}

// ── Custom Expense Section ────────────────────────────────────────────────────

export function CustomExpenseSection({
  items, view, onAdd, onRemove, onUpdate,
}: {
  items: CustomExpenseItem[];
  view: "monthly" | "yearly";
  onAdd: (item: Omit<CustomExpenseItem, "id">) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<CustomExpenseItem, "id">>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  function handleAdd() {
    const amount = Number(newAmount);
    if (!newLabel.trim() || isNaN(amount) || amount <= 0) return;
    onAdd({ label: newLabel.trim(), monthlyAmount: view === "yearly" ? amount / 12 : amount });
    setNewLabel("");
    setNewAmount("");
    setAdding(false);
  }

  return (
    <Section title="รายจ่ายอื่น ๆ" accentColor="#94a3b8">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-4"
          style={{ minHeight: 44, borderTop: "1px solid var(--border)" }}
        >
          <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{item.label}</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: "#94a3b8" }}>
            -{fmtBaht(multiply(item.monthlyAmount, view))}
          </p>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
            style={{ color: "var(--text-muted)" }}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <input
            autoFocus
            type="text"
            placeholder="ชื่อรายการ"
            className="flex-1 rounded-lg px-3 h-9 text-sm outline-none"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            type="number"
            min={0}
            placeholder={view === "yearly" ? "฿/ปี" : "฿/เดือน"}
            className="w-24 rounded-lg px-2 h-9 text-sm outline-none text-right"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "#94a3b8" }}
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--gold-500)", color: "#0a0e1a" }}
            onClick={handleAdd}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full flex items-center gap-2 px-4 text-sm"
          style={{ minHeight: 44, color: "var(--text-muted)", borderTop: items.length > 0 ? "1px solid var(--border)" : undefined }}
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายการ
        </button>
      )}
    </Section>
  );
}
