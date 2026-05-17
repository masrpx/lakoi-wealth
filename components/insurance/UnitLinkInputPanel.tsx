"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { solveIRR } from "@/lib/calculations/unit-link";
import { DEMO_UL } from "@/lib/data/demo-data";
import type { UnitLinkPolicy } from "@/types/insurance";

interface UnitLinkInputPanelProps {
  draft: UnitLinkPolicy;
  savedPolicies: UnitLinkPolicy[];
  selectedId: string | null;
  onChange: (updated: UnitLinkPolicy) => void;
  onSave: () => void;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onDelete: (id: string) => void;
  onTargetAgeChange: (age: number) => void;
}

const SECTIONS = ["หลัก", "ท็อปอัพ", "ผลตอบแทน", "ถอนเงิน", "กรมธรรม์"];

export function UnitLinkInputPanel({
  draft, savedPolicies, selectedId,
  onChange, onSave, onSelect, onAddNew, onDelete, onTargetAgeChange,
}: UnitLinkInputPanelProps) {
  const [openSection, setOpenSection] = useState<number | null>(0);
  // Section 2 local target inputs (not persisted — only the computed IRR is saved)
  const [targetValue, setTargetValue] = useState(0);
  const [targetAge, setTargetAge] = useState(0);

  const set = useCallback(
    <K extends keyof UnitLinkPolicy>(key: K, value: UnitLinkPolicy[K]) =>
      onChange({ ...draft, [key]: value }),
    [draft, onChange]
  );

  const toggle = (i: number) => setOpenSection(prev => prev === i ? null : i);
  const isNew = selectedId === null;

  // Compute and store IRR whenever target inputs change
  const applyTargetValue = (val: number, age: number) => {
    if (val > 0 && age > draft.startAge) {
      const irr = solveIRR(draft, val, age - draft.startAge, draft.startAge);
      onChange({ ...draft, expectedReturn: irr });
    }
    onTargetAgeChange(age > draft.startAge ? age : 0);
  };

  const handleTargetValueChange = (val: number) => {
    setTargetValue(val);
    applyTargetValue(val, targetAge);
  };

  const handleTargetAgeChange = (age: number) => {
    setTargetAge(age);
    applyTargetValue(targetValue, age);
  };

  // Ad-hoc top-up helpers
  const addAdHoc = () => set("adHocTopUps", [...draft.adHocTopUps, { year: 1, amount: 0 }]);
  const removeAdHoc = (i: number) =>
    set("adHocTopUps", draft.adHocTopUps.filter((_, idx) => idx !== i));
  const updateAdHocYear = (i: number, year: number) => {
    const next = [...draft.adHocTopUps];
    next[i] = { ...next[i], year: Math.max(1, Math.min(draft.paymentPeriodYears, year || 1)) };
    set("adHocTopUps", next);
  };
  const updateAdHocAmount = (i: number, amount: number) => {
    const next = [...draft.adHocTopUps];
    next[i] = { ...next[i], amount };
    set("adHocTopUps", next);
  };

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Tab row */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {SECTIONS.map((label, i) => (
          <button
            key={i}
            type="button"
            className="flex-1 text-xs font-semibold transition-colors"
            style={{
              minHeight: 44,
              background: openSection === i ? "var(--gold-500)" : "var(--bg-elevated)",
              color: openSection === i ? "#fff" : "var(--text-muted)",
              borderRight: i < SECTIONS.length - 1 ? "1px solid var(--border)" : "none",
            }}
            onClick={() => toggle(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {openSection !== null && (
        <div
          className="overflow-y-auto px-5 py-4 space-y-4"
          style={{ maxHeight: 280, background: "var(--bg-surface)" }}
        >
          {/* ── Section 0: ข้อมูลหลัก ── */}
          {openSection === 0 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ชื่อกรมธรรม์</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="เช่น AIA Unit Link Smart"
                  className="min-h-[44px] bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">อายุเริ่มต้น</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("startAge", Math.max(18, draft.startAge - 1))}>−</Button>
                  <span className="text-xl font-bold text-center flex-1">{draft.startAge} ปี</span>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("startAge", Math.min(70, draft.startAge + 1))}>+</Button>
                </div>
              </div>

              <CurrencyInput
                label="เบี้ยรายปี"
                value={draft.regularYearlyPremium}
                onChange={(v) => set("regularYearlyPremium", v)}
              />

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ระยะชำระเบี้ย (ปี)</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("paymentPeriodYears", Math.max(5, draft.paymentPeriodYears - 1))}>−</Button>
                  <span className="text-xl font-bold text-center flex-1">{draft.paymentPeriodYears} ปี</span>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("paymentPeriodYears", Math.min(40, draft.paymentPeriodYears + 1))}>+</Button>
                </div>
              </div>

              <CurrencyInput
                label="ทุนประกัน (ทุนชีวิต)"
                value={draft.sumInsured}
                onChange={(v) => set("sumInsured", v)}
              />
            </>
          )}

          {/* ── Section 1: Top-up ── */}
          {openSection === 1 && (
            <>
              <CurrencyInput
                label="ท็อปอัพครั้งแรก (ปีที่ 1)"
                value={draft.initialTopUp}
                onChange={(v) => set("initialTopUp", v)}
              />
              <CurrencyInput
                label="ท็อปอัพรายปี (ในช่วงชำระเบี้ย)"
                value={draft.recurringTopUp}
                onChange={(v) => set("recurringTopUp", v)}
              />

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">ท็อปอัพพิเศษ (เฉพาะปี)</Label>
                {draft.adHocTopUps.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">ปีที่</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={entry.year}
                      onChange={(e) => updateAdHocYear(i, parseInt(e.target.value) || 1)}
                      className="w-14 text-sm font-bold text-center rounded-lg outline-none"
                      style={{
                        height: 36, background: "var(--bg-elevated)",
                        border: "1px solid var(--border)", color: "var(--text-primary)",
                      }}
                    />
                    <div className="flex-1">
                      <CurrencyInput
                        value={entry.amount}
                        onChange={(v) => updateAdHocAmount(i, v)}
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAdHoc(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={addAdHoc}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />เพิ่มท็อปอัพพิเศษ
                </Button>
              </div>
            </>
          )}

          {/* ── Section 2: ผลตอบแทน & ค่าธรรมเนียม ── */}
          {openSection === 2 && (
            <>
              <p className="text-xs text-muted-foreground">
                กรอกมูลค่ากรมธรรม์ ณ อายุที่ระบุจากตารางบริษัทประกัน ระบบจะคำนวณ IRR ให้
              </p>

              <CurrencyInput
                label="มูลค่าเป้าหมาย (จากตารางบริษัท)"
                value={targetValue}
                onChange={handleTargetValueChange}
              />

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ณ อายุ (ปี)</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => handleTargetAgeChange(Math.max(draft.startAge + 1, targetAge - 1))}>−</Button>
                  <span className="text-xl font-bold text-center flex-1">
                    {targetAge > 0 ? `${targetAge} ปี` : "—"}
                  </span>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => handleTargetAgeChange(Math.min(draft.startAge + 59, (targetAge || draft.startAge) + 1))}>+</Button>
                </div>
              </div>

              {/* Computed IRR display */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "rgba(45,212,191,0.08)", border: "1px solid #2dd4bf" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#2dd4bf" }}>
                  ผลตอบแทนโดยนัย
                </span>
                <span className="text-xl font-bold" style={{ color: "#2dd4bf" }}>
                  {draft.expectedReturn.toFixed(2)}% ต่อปี
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ค่า COI (% ต่อปี)</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("costOfInsurance", Math.max(0, +(draft.costOfInsurance - 0.25).toFixed(2)))}>−</Button>
                  <span className="text-xl font-bold text-center flex-1">{draft.costOfInsurance.toFixed(2)}%</span>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                    onClick={() => set("costOfInsurance", Math.min(5, +(draft.costOfInsurance + 0.25).toFixed(2)))}>+</Button>
                </div>
              </div>
            </>
          )}

          {/* ── Section 3: การถอนเงิน ── */}
          {openSection === 3 && (
            <>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">เปิดใช้การถอนเงิน</Label>
                <Switch
                  checked={draft.withdrawals !== null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      set("withdrawals", {
                        startAge: Math.max(draft.startAge + 1, 60),
                        monthlyAmount: 30000,
                      });
                    } else {
                      set("withdrawals", null);
                    }
                  }}
                />
              </div>

              {draft.withdrawals !== null && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">อายุเริ่มถอน</Label>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                        onClick={() => set("withdrawals", {
                          ...draft.withdrawals!,
                          startAge: Math.max(draft.startAge + 1, draft.withdrawals!.startAge - 1),
                        })}>−</Button>
                      <span className="text-xl font-bold text-center flex-1">{draft.withdrawals.startAge} ปี</span>
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
                        onClick={() => set("withdrawals", {
                          ...draft.withdrawals!,
                          startAge: Math.min(draft.startAge + 60, draft.withdrawals!.startAge + 1),
                        })}>+</Button>
                    </div>
                  </div>

                  <CurrencyInput
                    label="ถอนต่อเดือน"
                    value={draft.withdrawals.monthlyAmount}
                    onChange={(v) => set("withdrawals", { ...draft.withdrawals!, monthlyAmount: v })}
                  />
                </>
              )}
            </>
          )}

          {/* ── Section 4: กรมธรรม์ / Demo ── */}
          {openSection === 4 && (
            <>
              {savedPolicies.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">กรมธรรม์ที่บันทึก</Label>
                  {savedPolicies.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        background: p.id === selectedId ? "rgba(201,168,76,0.1)" : "var(--bg-elevated)",
                        border: `1px solid ${p.id === selectedId ? "var(--gold-500)" : "var(--border)"}`,
                      }}
                      onClick={() => onSelect(p.id)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name || "ไม่มีชื่อ"}</p>
                        <p className="text-xs text-muted-foreground">
                          เบี้ย ฿{p.regularYearlyPremium.toLocaleString()} · {p.paymentPeriodYears} ปี · {p.expectedReturn.toFixed(1)}%
                        </p>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-1" onClick={onAddNew}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />เพิ่มกรมธรรม์ใหม่
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onChange(DEMO_UL)}
              >
                รีเซ็ตเป็นข้อมูลตัวอย่าง
              </Button>

              <Separator />

              <Button
                className="w-full min-h-[48px] text-base font-semibold"
                style={{ background: "var(--gold-500)", color: "#fff" }}
                onClick={onSave}
              >
                {isNew ? "บันทึกกรมธรรม์" : "อัปเดตกรมธรรม์"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
