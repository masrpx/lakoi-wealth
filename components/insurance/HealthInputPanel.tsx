"use client";

import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { PremiumGrid } from "@/components/inputs/PremiumGrid";
import type { HealthPolicy } from "@/types/insurance";

interface HealthInputPanelProps {
  draft: HealthPolicy;
  savedPolicies: HealthPolicy[];
  selectedId: string | null;
  onChange: (updated: HealthPolicy) => void;
  onSave: () => void;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onDelete: (id: string) => void;
}

export function HealthInputPanel({
  draft, savedPolicies, selectedId,
  onChange, onSave, onSelect, onAddNew, onDelete,
}: HealthInputPanelProps) {
  const set = useCallback(
    <K extends keyof HealthPolicy>(key: K, value: HealthPolicy[K]) =>
      onChange({ ...draft, [key]: value }),
    [draft, onChange]
  );

  const isNew = selectedId === null;

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">

        {/* Saved policy list */}
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
                      วงเงิน ฿{p.sumInsured.toLocaleString()} · อายุ {p.startAge}–{p.endAge}
                    </p>
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
            placeholder="เช่น BDMS Health Lump Sum"
            className="min-h-[44px] bg-background"
          />
        </div>

        {/* Start age */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">อายุเริ่มต้น</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("startAge", Math.max(1, draft.startAge - 1))}>−</Button>
            <span className="text-xl font-bold text-center flex-1">{draft.startAge} ปี</span>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("startAge", Math.min(draft.endAge - 1, draft.startAge + 1))}>+</Button>
          </div>
        </div>

        {/* End age */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">อายุสิ้นสุดความคุ้มครอง</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("endAge", Math.max(draft.startAge + 1, draft.endAge - 1))}>−</Button>
            <span className="text-xl font-bold text-center flex-1">{draft.endAge} ปี</span>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"
              onClick={() => set("endAge", Math.min(99, draft.endAge + 1))}>+</Button>
          </div>
        </div>

        {/* Sum insured */}
        <CurrencyInput
          label="วงเงินคุ้มครอง (ต่อครั้ง)"
          value={draft.sumInsured}
          onChange={(v) => set("sumInsured", v)}
        />

        {/* Premium grid */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">ตารางเบี้ยตามอายุ</Label>
          <p className="text-xs text-muted-foreground">
            กรอกเบี้ยที่ช่วงอายุหลัก ระบบจะเติมช่องว่างให้อัตโนมัติ
          </p>
          <PremiumGrid
            sparseInputs={draft.yearlyPremiumByAge}
            startAge={draft.startAge}
            endAge={draft.endAge}
            onChange={(v) => set("yearlyPremiumByAge", v)}
          />
        </div>

        {/* Save */}
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
