"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
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
}

const SECTIONS = ["หลัก", "ท็อปอัพ", "ผลตอบแทน", "ถอนเงิน"];

export function UnitLinkInputPanel({
  draft, savedPolicies, selectedId,
  onChange, onSave, onSelect, onAddNew, onDelete,
}: UnitLinkInputPanelProps) {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const set = useCallback(
    <K extends keyof UnitLinkPolicy>(key: K, value: UnitLinkPolicy[K]) =>
      onChange({ ...draft, [key]: value }),
    [draft, onChange]
  );

  const toggle = (i: number) => setOpenSection(prev => prev === i ? null : i);
  const isNew = selectedId === null;

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
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">

        {/* Policy list — above tabs, matching endowment layout */}
        {savedPolicies.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">กรมธรรม์ที่บันทึก</Label>
            <div className="space-y-1.5">
              {savedPolicies.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                  style={{
                    background: p.id === selectedId ? "rgba(201,168,76,0.1)" : "var(--bg-surface)",
                    border: `1px solid ${p.id === selectedId ? "var(--gold-500)" : "var(--border)"}`,
                  }}
                  onClick={() => onSelect(p.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name || "ไม่มีชื่อ"}</p>
                    <p className="text-xs text-muted-foreground">
                      ฿{p.regularYearlyPremium.toLocaleString()}/ปี · {p.paymentPeriodYears} ปี · {p.expectedReturn.toFixed(1)}%
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
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onAddNew}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />เพิ่มกรมธรรม์ใหม่
              </Button>
              <Button variant="outline" size="sm" onClick={() => onChange(DEMO_UL)}>
                รีเซ็ต
              </Button>
            </div>
            <Separator />
          </div>
        )}

        {/* Accordion tabs */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {/* Tab row */}
          <div className="flex" style={{ borderBottom: openSection !== null ? "1px solid var(--border)" : "none" }}>
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
            <div className="px-5 py-4 space-y-4" style={{ background: "var(--bg-surface)" }}>

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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm text-muted-foreground">ระยะชำระเบี้ย</Label>
                      <span className="text-sm font-semibold">{draft.paymentPeriodYears} ปี (ถึงอายุ {draft.startAge + draft.paymentPeriodYears - 1})</span>
                    </div>
                    <input
                      type="range"
                      value={draft.paymentPeriodYears}
                      min={5} max={40} step={1}
                      onChange={(e) => set("paymentPeriodYears", Number(e.target.value))}
                      className="w-full cursor-pointer my-1"
                      style={{ "--slider-fill": `${((draft.paymentPeriodYears - 5) / 35) * 100}%` } as React.CSSProperties}
                    />
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
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm text-muted-foreground">ผลตอบแทนคาดหวัง</Label>
                      <span className="text-sm font-semibold" style={{ color: "#2dd4bf" }}>
                        {draft.expectedReturn.toFixed(1)}% ต่อปี
                      </span>
                    </div>
                    <input
                      type="range"
                      value={draft.expectedReturn}
                      min={0} max={20} step={0.5}
                      onChange={(e) => set("expectedReturn", Number(e.target.value))}
                      className="w-full cursor-pointer my-1"
                      style={{ "--slider-fill": `${(draft.expectedReturn / 20) * 100}%` } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>10%</span>
                      <span>20%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm text-muted-foreground">ค่า COI (ต้นทุนประกัน)</Label>
                      <span className="text-sm font-semibold" style={{ color: "var(--rose-500)" }}>
                        {draft.costOfInsurance.toFixed(2)}% ต่อปี
                      </span>
                    </div>
                    <input
                      type="range"
                      value={draft.costOfInsurance}
                      min={0} max={5} step={0.25}
                      onChange={(e) => set("costOfInsurance", Number(e.target.value))}
                      className="w-full cursor-pointer my-1"
                      style={{ "--slider-fill": `${(draft.costOfInsurance / 5) * 100}%` } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>2.5%</span>
                      <span>5%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm text-muted-foreground">ค่าธรรมเนียมกองทุน (Admin Fee)</Label>
                      <span className="text-sm font-semibold" style={{ color: "var(--rose-500)" }}>
                        {(draft.adminFee ?? 0).toFixed(2)}% ต่อปี
                      </span>
                    </div>
                    <input
                      type="range"
                      value={draft.adminFee ?? 0}
                      min={0} max={3} step={0.25}
                      onChange={(e) => set("adminFee", Number(e.target.value))}
                      className="w-full cursor-pointer my-1"
                      style={{ "--slider-fill": `${((draft.adminFee ?? 0) / 3) * 100}%` } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>1.5%</span>
                      <span>3%</span>
                    </div>
                  </div>

                  {/* Net return preview — after all fees */}
                  <div
                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "rgba(45,212,191,0.07)", border: "1px solid #2dd4bf33" }}
                  >
                    <span className="text-xs text-muted-foreground">ผลตอบแทนสุทธิ (หักทุกค่าธรรมเนียม)</span>
                    <span className="text-base font-bold" style={{ color: "#2dd4bf" }}>
                      {Math.max(0, draft.expectedReturn - draft.costOfInsurance - (draft.adminFee ?? 0)).toFixed(2)}% ต่อปี
                    </span>
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

            </div>
          )}
        </div>

        {/* Save button — always visible below accordion, matching endowment */}
        <Button
          className="w-full min-h-[48px] text-base font-semibold"
          style={{ background: "var(--gold-500)", color: "#fff" }}
          onClick={onSave}
        >
          {isNew ? "บันทึกกรมธรรม์" : "อัปเดตกรมธรรม์"}
        </Button>

      </div>
    </ScrollArea>
  );
}
