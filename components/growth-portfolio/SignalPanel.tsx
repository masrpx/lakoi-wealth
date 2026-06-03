"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PortfolioAsset, PriceData, AssetSignal } from "@/types/growthPortfolio";

interface Props {
  assets: PortfolioAsset[];
  priceCache: Record<string, PriceData>;
  signals: Record<string, AssetSignal>;
}

const DOT: Record<string, string> = {
  green:  "#2dd4bf",
  yellow: "#c9a84c",
  red:    "#fb7185",
};

const COMPOSITE_STYLE: Record<string, { bg: string; color: string }> = {
  BUY:   { bg: "rgba(45,212,191,0.12)",  color: "#2dd4bf" },
  HOLD:  { bg: "rgba(201,168,76,0.12)",  color: "#c9a84c" },
  AVOID: { bg: "rgba(251,113,133,0.12)", color: "#fb7185" },
};

const POINTS_STYLE: Record<string, { color: string }> = {
  positive: { color: "#2dd4bf" },
  zero:     { color: "var(--muted-foreground)" },
  negative: { color: "#fb7185" },
};

function pointsLabel(pts: number): string {
  if (pts > 0) return `+${pts} pt${pts !== 1 ? "s" : ""}`;
  if (pts < 0) return `${pts} pt${pts !== -1 ? "s" : ""}`;
  return "0 pts";
}

function pointsStyle(pts: number) {
  return pts > 0 ? POINTS_STYLE.positive : pts < 0 ? POINTS_STYLE.negative : POINTS_STYLE.zero;
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />;
}

export function SignalPanel({ assets, priceCache, signals }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(ticker: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  }

  return (
    <div className="px-4 pb-4">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold">Technical Signals</p>
          <p className="text-xs text-muted-foreground mt-0.5">Informational only — not financial advice. Tap a row to see indicator breakdown.</p>
        </div>

        {assets.map((asset, i) => {
          const signal = signals[asset.ticker];
          const pd = priceCache[asset.ticker];
          const isExpanded = expanded.has(asset.ticker);
          const canExpand = signal && signal.hasEnoughData && !signal.isIncomeAsset;

          return (
            <div
              key={asset.id}
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
                background: i % 2 === 0 ? "var(--background)" : "var(--card)",
              }}
            >
              {/* Summary row */}
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
                onClick={() => canExpand && toggle(asset.ticker)}
                style={{ cursor: canExpand ? "pointer" : "default" }}
              >
                {canExpand ? (
                  isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <span className="w-3.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{asset.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{asset.ticker}</span>
                </div>

                {/* Mini indicator dots */}
                {signal && signal.hasEnoughData && !signal.isIncomeAsset && (
                  <div className="flex items-center gap-1.5 mr-3">
                    <Dot color={DOT[signal.rsiSignal]} />
                    <Dot color={DOT[signal.emaCross]} />
                    <Dot color={DOT[signal.vsEma200]} />
                    <Dot color={DOT[signal.dist52wSignal]} />
                  </div>
                )}

                {signal ? (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={signal.isIncomeAsset
                      ? { background: "rgba(201,168,76,0.12)", color: "#c9a84c" }
                      : COMPOSITE_STYLE[signal.composite]}
                  >
                    {signal.isIncomeAsset ? "HOLD" : `${signal.composite} (${signal.score > 0 ? "+" : ""}${signal.score})`}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{pd ? "Loading…" : "No data"}</span>
                )}
              </button>

              {/* Income asset note */}
              {signal?.isIncomeAsset && (
                <p className="px-10 pb-3 text-xs text-muted-foreground">{signal.incomeLabel}</p>
              )}

              {/* Insufficient data */}
              {signal && !signal.hasEnoughData && !signal.isIncomeAsset && (
                <p className="px-10 pb-3 text-xs text-muted-foreground">Insufficient price history (&lt;50 days)</p>
              )}

              {/* Expanded breakdown */}
              {isExpanded && canExpand && (
                <div className="px-4 pb-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div
                      className="grid text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5"
                      style={{ gridTemplateColumns: "16px 100px 1fr 60px", background: "var(--muted)" }}
                    >
                      <span />
                      <span>Indicator</span>
                      <span>Detail</span>
                      <span className="text-right">Score</span>
                    </div>

                    {signal.breakdown.map((b, idx) => (
                      <div
                        key={idx}
                        className="grid items-center px-3 py-2 text-xs"
                        style={{
                          gridTemplateColumns: "16px 100px 1fr 60px",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <Dot color={DOT[b.color]} />
                        <span className="font-medium">{b.label}</span>
                        <span className="text-muted-foreground pr-2">{b.detail}</span>
                        <span className="text-right font-mono font-semibold" style={pointsStyle(b.points)}>
                          {pointsLabel(b.points)}
                        </span>
                      </div>
                    ))}

                    <div
                      className="grid items-center px-3 py-2 text-xs font-semibold"
                      style={{ gridTemplateColumns: "16px 100px 1fr 60px", borderTop: "2px solid var(--border)" }}
                    >
                      <span />
                      <span>Total score</span>
                      <span className="text-muted-foreground">
                        {signal.composite === "BUY" ? "≥ 3 → BUY" : signal.composite === "AVOID" ? "< 0 → AVOID" : "0–2 → HOLD"}
                      </span>
                      <span className="text-right font-mono" style={pointsStyle(signal.score)}>
                        {signal.score > 0 ? "+" : ""}{signal.score}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
