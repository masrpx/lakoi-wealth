"use client";

import { useMemo } from "react";
import type { InvestmentItem } from "@/types";
import { projectPortfolioValue, portfolioTotalDCA } from "@/lib/calculations/portfolio";

function fmtBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿0`;
}

interface Props {
  investments: InvestmentItem[];
  currentAge: number;
}

const HORIZONS = [5, 10, 20, 30];

export function GrowthTable({ investments, currentAge }: Props) {
  const monthlyDCA = portfolioTotalDCA(investments);

  const rows = useMemo(() => {
    const projection = projectPortfolioValue(investments, currentAge, 30);
    return HORIZONS.map((yr) => {
      const pt = projection[yr - 1];
      const dcaContrib = monthlyDCA * yr * 12;
      return {
        yr,
        value: pt?.value ?? 0,
        dcaContrib,
      };
    });
  }, [investments, currentAge, monthlyDCA]);

  return (
    <div className="mx-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          การเติบโตที่คาดการณ์
        </p>
      </div>
      <div style={{ background: "var(--bg-elevated)" }}>
        {rows.map((row, i) => (
          <div
            key={row.yr}
            className="flex items-center px-4"
            style={{ minHeight: 44, borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
          >
            <span className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>
              {row.yr} ปี (อายุ {currentAge + row.yr})
            </span>
            <span className="text-sm font-bold tabular-nums mr-4" style={{ color: "var(--gold-500)" }}>
              {fmtBaht(row.value)}
            </span>
            <span className="text-xs tabular-nums" style={{ color: "#2dd4bf" }}>
              +{fmtBaht(row.dcaContrib)} DCA
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
