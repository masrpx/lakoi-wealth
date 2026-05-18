"use client";

import { Trash2, CheckSquare, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Scenario } from "@/types";
import type { ScenarioMetrics } from "@/lib/calculations/scenarios";

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  scenario: Scenario;
  metrics: ScenarioMetrics;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onLoad: () => void;
}

export function ScenarioCard({ scenario, metrics, selected, onToggleSelect, onDelete, onLoad }: Props) {
  const gap = metrics.retirementGapMonthly;
  const gapColor = gap >= 0 ? "var(--teal-500)" : "var(--rose-500)";
  const gapLabel = gap >= 0 ? `+${fmtBaht(gap)}/เดือน` : `${fmtBaht(gap)}/เดือน`;

  return (
    <div
      className="relative rounded-2xl p-5 transition-all duration-200 cursor-pointer"
      style={{
        background: selected ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: selected
          ? "1.5px solid var(--gold-500)"
          : "1px solid var(--border)",
        boxShadow: selected ? "0 0 0 1px var(--gold-500)" : undefined,
      }}
      onClick={onToggleSelect}
    >
      {/* Select indicator */}
      <div className="absolute top-4 right-4">
        {selected ? (
          <CheckSquare className="h-5 w-5" style={{ color: "var(--gold-500)" }} />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Name + date */}
      <div className="mb-4 pr-8">
        <h3 className="font-semibold text-sm leading-snug">{scenario.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(scenario.createdAt)}</p>
      </div>

      {/* Key metrics */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">มูลค่าสุทธิที่อายุ {metrics.retirementAge}</span>
          <span className="text-sm font-bold font-display" style={{ color: "var(--gold-500)" }}>
            {fmtBaht(metrics.netWorthAtRetirement)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">เบี้ยประกันรวม/ปี</span>
          <span className="text-sm font-semibold" style={{ color: "var(--rose-500)" }}>
            {fmtBaht(metrics.totalYearlyPremium)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">Gap เกษียณ</span>
          <span className="text-sm font-semibold" style={{ color: gapColor }}>
            {gapLabel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="mt-4 pt-3 flex gap-2"
        style={{ borderTop: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={onLoad}
          style={{ color: "var(--text-secondary)" }}
        >
          <Upload className="h-3.5 w-3.5" />
          โหลด
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onDelete}
          style={{ color: "var(--rose-500)" }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
