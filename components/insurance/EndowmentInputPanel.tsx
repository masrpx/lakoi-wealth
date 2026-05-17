"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import type { EndowmentPolicy } from "@/types/insurance";

function linearCashValues(years: number, finalValue: number): number[] {
  return Array.from({ length: years }, (_, i) =>
    Math.round((finalValue / years) * (i + 1))
  );
}

interface EndowmentInputPanelProps {
  draft: EndowmentPolicy;
  savedPolicies: EndowmentPolicy[];
  selectedId: string | null;
  onChange: (updated: EndowmentPolicy) => void;
  onSave: () => void;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onDelete: (id: string) => void;
}

export function EndowmentInputPanel({
  draft, savedPolicies, selectedId,
  onChange, onSave, onSelect, onAddNew, onDelete,
}: EndowmentInputPanelProps) {
  const [showCashValues, setShowCashValues] = useState(false);

  const set = useCallback(
    <K extends keyof EndowmentPolicy>(key: K, value: EndowmentPolicy[K]) =>
      onChange({ ...draft, [key]: value }),
    [draft, onChange]
  );

  const handleCoverageChange = (years: number) => {
    const newTable = linearCashValues(years, draft.sumInsured || draft.yearlyPremium * years);
    onChange({ ...draft, coveragePeriodYears: years, cashValueByYear: newTable });
  };

  const handleSumInsuredChange = (value: number) => {
    const newTable = linearCashValues(draft.coveragePeriodYears, value);
    onChange({ ...draft, sumInsured: value, cashValueByYear: newTable });
  };

  const handleCashValueChange = (yearIndex: number, value: number) => {
    const updated = [...draft.cashValueByYear];
    updated[yearIndex] = value;
    set("cashValueByYear", updated);
  };

  const isNew = selectedId === null;

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">

        {/* Policy list / selector */}
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
                    <p className="text-xs text-muted-foreground">฿{p.yearlyPremium.toLocaleString()}/ปี · {p.coveragePeriodYears} ปี</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-1" onClick={onAddNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />เพิ่มกรมธรรม์ใหม่
            </Button>
            <Separator />
          </div>
        )}

        {/* Policy name */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">ชื่อกรมธรรม์</Label>
          <Input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น AIA Issara 20/20"
            className="min-h-[44px] bg-background"
          />
        </div>

        {/* Start age stepper */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">อายุเริ่มต้น</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("startAge", Math.max(1, draft.startAge - 1))}>−</Button>
            <span className="text-xl font-bold text-center flex-1">{draft.startAge} ปี</span>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("startAge", Math.min(80, draft.startAge + 1))}>+</Button>
          </div>
        </div>

        {/* Premium */}
        <CurrencyInput
          label="เบี้ยประกันต่อปี"
          value={draft.yearlyPremium}
          onChange={(v) => set("yearlyPremium", v)}
        />

        {/* Payment period */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground">ระยะเวลาชำระเบี้ย</Label>
            <span className="text-sm font-semibold">{draft.paymentPeriodYears} ปี</span>
          </div>
          <input
            type="range"
            value={draft.paymentPeriodYears}
            min={1} max={30} step={1}
            onChange={(e) => set("paymentPeriodYears", Math.min(Number(e.target.value), draft.coveragePeriodYears))}
            className="w-full cursor-pointer my-1"
            style={{ "--slider-fill": `${((draft.paymentPeriodYears - 1) / 29) * 100}%` } as React.CSSProperties}
          />
        </div>

        {/* Coverage period */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground">ระยะเวลาคุ้มครอง</Label>
            <span className="text-sm font-semibold">{draft.coveragePeriodYears} ปี (ถึงอายุ {draft.startAge + draft.coveragePeriodYears - 1})</span>
          </div>
          <input
            type="range"
            value={draft.coveragePeriodYears}
            min={draft.paymentPeriodYears} max={99} step={1}
            onChange={(e) => handleCoverageChange(Number(e.target.value))}
            className="w-full cursor-pointer my-1"
            style={{ "--slider-fill": `${((draft.coveragePeriodYears - draft.paymentPeriodYears) / Math.max(1, 99 - draft.paymentPeriodYears)) * 100}%` } as React.CSSProperties}
          />
        </div>

        {/* Sum insured */}
        <div className="space-y-1">
          <CurrencyInput
            label="ทุนประกัน (ความคุ้มครองชีวิต)"
            value={draft.sumInsured}
            onChange={handleSumInsuredChange}
          />
          <p className="text-xs text-muted-foreground px-0.5">คงที่ตลอดสัญญา — เงินที่จ่ายหากเสียชีวิต</p>
        </div>

        {/* Projected maturity value */}
        <CurrencyInput
          label="เงินคืนครบสัญญา + ปันผล (ประมาณการ)"
          value={draft.projectedMaturityValue ?? 0}
          onChange={(v) => set("projectedMaturityValue", v > 0 ? v : undefined)}
          placeholder="กรอกถ้ามีจากตารางประมาณการ"
        />

        {/* Cash value table */}
        <div>
          <button
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowCashValues(!showCashValues)}
          >
            <span>ตารางเงินคืนรายปี (จากสัญญา)</span>
            {showCashValues ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showCashValues && (
            <div
              className="mt-2 rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="grid grid-cols-3 px-3 py-2 text-xs font-semibold text-muted-foreground" style={{ background: "var(--bg-surface)" }}>
                <span>ปีที่</span><span>อายุ</span><span className="text-right">เงินคืน</span>
              </div>
              <ScrollArea className="max-h-56">
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {draft.cashValueByYear.map((cv, i) => (
                    <div key={i} className="grid grid-cols-3 items-center px-3 py-1.5" style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "transparent" }}>
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                      <span className="text-xs text-muted-foreground">{draft.startAge + i}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        defaultValue={cv.toLocaleString("th-TH")}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value.replace(/,/g, ""), 10);
                          if (!isNaN(n)) handleCashValueChange(i, n);
                        }}
                        className="text-xs text-right bg-transparent outline-none w-full focus:text-foreground"
                        style={{ color: "var(--text-primary)", minWidth: 0 }}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Save button */}
        <Button
          className="w-full min-h-[48px] text-base font-semibold mt-2"
          style={{ background: "var(--gold-500)", color: "#fff" }}
          onClick={onSave}
        >
          {isNew ? "บันทึกกรมธรรม์" : "อัปเดตกรมธรรม์"}
        </Button>

      </div>
    </ScrollArea>
  );
}
