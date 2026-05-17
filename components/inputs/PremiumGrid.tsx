"use client";

import { useState, useMemo, useRef } from "react";
import { fillHealthPremiumGrid } from "@/lib/calculations/health-premium";

interface PremiumGridProps {
  sparseInputs: Record<number, number>;
  startAge: number;
  endAge: number;
  onChange: (updated: Record<number, number>) => void;
}

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${n.toLocaleString("th-TH")}`;
}

// Band-aligned key ages: 1, 6, 11, 16, 21, 26, 31, 36... (matches 21–25, 26–30, 31–35 band scheme)
function isKeyAge(age: number): boolean {
  return (age - 1) % 5 === 0;
}

export function PremiumGrid({ sparseInputs, startAge, endAge, onChange }: PremiumGridProps) {
  const [show80Plus, setShow80Plus] = useState(false);

  const filledGrid = useMemo(
    () => fillHealthPremiumGrid(sparseInputs, startAge, endAge),
    [sparseInputs, startAge, endAge]
  );

  const totalPremium = useMemo(
    () => Object.values(filledGrid).reduce((s, v) => s + v, 0),
    [filledGrid]
  );

  // Key ages only: band-aligned (21, 26, 31, 36, 41 ...)
  const keyAges = useMemo(() => {
    const marks: number[] = [];
    for (let a = startAge; a <= endAge; a++) {
      if (isKeyAge(a)) marks.push(a);
    }
    return marks;
  }, [startAge, endAge]);

  const mainAges = useMemo(() => keyAges.filter(a => a < 80), [keyAges]);
  const oldAges  = useMemo(() => keyAges.filter(a => a >= 80), [keyAges]);

  const promote = (age: number) => {
    const interpolated = filledGrid[age] ?? 0;
    onChange({ ...sparseInputs, [age]: interpolated });
  };

  const demote = (age: number) => {
    const next = { ...sparseInputs };
    delete next[age];
    onChange(next);
  };

  const updateValue = (age: number, raw: string) => {
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    const value = isNaN(n) ? 0 : n;
    onChange({ ...sparseInputs, [age]: value });
  };

  const renderRows = (ages: number[]) =>
    ages.map((age) => {
      const isExplicit = sparseInputs[age] !== undefined;
      const interpolated = filledGrid[age] ?? 0;

      return (
        <PremiumRow
          key={age}
          age={age}
          value={interpolated}
          isExplicit={isExplicit}
          onPromote={() => promote(age)}
          onDemote={() => demote(age)}
          onChangeValue={(raw) => updateValue(age, raw)}
        />
      );
    });

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-xs text-muted-foreground">เบี้ยรวมตลอดชีวิต</p>
          <p className="text-base font-bold" style={{ color: "var(--rose-500)" }}>
            {fmtBaht(totalPremium)}
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-[48px_1fr] px-3 py-1.5 text-xs font-semibold text-muted-foreground"
        style={{ background: "var(--bg-elevated)" }}
      >
        <span>อายุ</span>
        <span>เบี้ย/ปี</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {renderRows(mainAges)}
        {show80Plus && renderRows(oldAges)}
      </div>

      {/* 80+ toggle — always visible below scroll area */}
      {endAge >= 80 && (
        <button
          type="button"
          className="w-full px-3 text-xs text-center transition-colors hover:bg-black/[0.03]"
          style={{
            minHeight: 40,
            borderTop: "1px dashed var(--border)",
            color: "var(--text-muted)",
          }}
          onClick={() => setShow80Plus((v) => !v)}
        >
          {show80Plus ? "ซ่อน 80–99 ▲" : "แสดงอายุ 80–99 ▼"}
        </button>
      )}
    </div>
  );
}

interface PremiumRowProps {
  age: number;
  value: number;
  isExplicit: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onChangeValue: (raw: string) => void;
}

function PremiumRow({ age, value, isExplicit, onPromote, onChangeValue }: PremiumRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const displayValue = focused
    ? (value === 0 ? "" : String(value))
    : (value === 0 ? "" : value.toLocaleString("th-TH"));

  const handleAutoRowClick = () => {
    onPromote();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (!isExplicit) {
    return (
      <button
        className="grid grid-cols-[48px_1fr] items-center w-full px-3 text-left transition-colors hover:bg-black/[0.03]"
        style={{ minHeight: 44, borderBottom: "1px solid var(--border)" }}
        onClick={handleAutoRowClick}
        type="button"
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{age}</span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {value > 0 ? `฿${value.toLocaleString("th-TH")}` : "—"}
        </span>
      </button>
    );
  }

  return (
    <div
      className="grid grid-cols-[48px_1fr] items-center px-3"
      style={{
        minHeight: 44,
        borderBottom: "1px solid var(--border)",
        background: focused ? "rgba(201,168,76,0.04)" : "transparent",
      }}
    >
      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{age}</span>
      <div className="relative flex items-center pr-2">
        <span className="absolute left-0 text-xs font-medium select-none pointer-events-none" style={{ color: "var(--gold-500)" }}>฿</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder="0"
          className="w-full pl-4 text-sm bg-transparent outline-none"
          style={{ color: "var(--text-primary)" }}
          onFocus={() => setFocused(true)}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => {
            setFocused(false);
            onChangeValue(String(value));
          }}
        />
      </div>
    </div>
  );
}
