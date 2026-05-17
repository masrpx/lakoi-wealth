"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { AllocationItem } from "@/lib/calculations/portfolio";

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

interface Props {
  allocations: AllocationItem[];
  totalValue: number;
}

export function AllocationChart({ allocations, totalValue }: Props) {
  if (allocations.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-4">
        {/* Pie */}
        <div className="shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocations}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                isAnimationActive={false}
                strokeWidth={2}
                stroke="var(--bg-elevated)"
              >
                {allocations.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [fmtBaht(Number(v)), ""]}
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {allocations.map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: item.color }}>
                {item.pct.toFixed(0)}%
              </span>
            </div>
          ))}
          <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs font-bold" style={{ color: "var(--gold-500)" }}>
              รวม {fmtBaht(totalValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
