"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { PortfolioAsset, PriceData, DCAEntry, AssetSignal } from "@/types/growthPortfolio";
import { assetCurrentValue } from "@/lib/store/growthPortfolio";

interface Props {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  signals: Record<string, AssetSignal>;
  usdthbRate: number;
}

function fmtThb(n: number) {
  return `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function RebalancerPanel({ assets, dcaEntries, priceCache, signals, usdthbRate }: Props) {
  const [newCashThb, setNewCashThb] = useState("");

  const cashThb = parseFloat(newCashThb) || 0;
  const cashUsd = usdthbRate > 0 ? cashThb / usdthbRate : 0;

  const rows = assets.map((a) => {
    const pd = priceCache[a.ticker];
    const currentValueUsd = assetCurrentValue(a.id, a.manualValueTHB, dcaEntries, pd?.price, usdthbRate);
    return { asset: a, currentValueUsd };
  });

  const totalCurrentUsd = rows.reduce((s, r) => s + r.currentValueUsd, 0);
  const totalNewUsd = totalCurrentUsd + cashUsd;

  const avoidTickers = new Set(
    assets.filter((a) => signals[a.ticker]?.composite === "AVOID").map((a) => a.ticker)
  );

  const buyAmountsUsd = rows.map((r) => {
    if (avoidTickers.has(r.asset.ticker)) return 0;
    const targetValueUsd = totalNewUsd * (r.asset.targetWeight / 100);
    return Math.max(0, targetValueUsd - r.currentValueUsd);
  });

  const totalBuyUsd = buyAmountsUsd.reduce((s, b) => s + b, 0);
  const normalizedUsd = totalBuyUsd > 0
    ? buyAmountsUsd.map((b) => (b / totalBuyUsd) * cashUsd)
    : buyAmountsUsd;

  return (
    <div className="px-4 pb-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold mb-3">Rebalancing Calculator</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground shrink-0">New cash (฿)</span>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={newCashThb}
            onChange={(e) => setNewCashThb(e.target.value)}
            className="h-9 text-right font-mono"
          />
          {cashThb > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              ≈ ${cashUsd.toFixed(0)}
            </span>
          )}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div
            className="grid text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2"
            style={{ gridTemplateColumns: "1fr 50px 50px 50px 90px", background: "var(--muted)" }}
          >
            <span>Asset</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Target</span>
            <span className="text-right">Drift</span>
            <span className="text-right">Buy ฿</span>
          </div>

          {rows.map(({ asset, currentValueUsd }, i) => {
            const actualPct = totalCurrentUsd > 0 ? (currentValueUsd / totalCurrentUsd) * 100 : 0;
            const drift = actualPct - asset.targetWeight;
            const buyThb = normalizedUsd[i] * usdthbRate;
            const isAvoid = avoidTickers.has(asset.ticker);

            return (
              <div
                key={asset.id}
                className="grid items-center px-3 py-2 text-xs"
                style={{
                  gridTemplateColumns: "1fr 50px 50px 50px 90px",
                  borderTop: "1px solid var(--border)",
                  opacity: isAvoid ? 0.5 : 1,
                }}
              >
                <div>
                  <span className="font-medium">{asset.name}</span>
                  {isAvoid && (
                    <span className="ml-1.5 text-xs px-1 rounded" style={{ background: "rgba(251,113,133,0.15)", color: "#fb7185" }}>
                      Avoid
                    </span>
                  )}
                </div>
                <span className="text-right">{actualPct.toFixed(1)}%</span>
                <span className="text-right text-muted-foreground">{asset.targetWeight}%</span>
                <span className="text-right" style={{ color: drift > 1 ? "#fb7185" : drift < -1 ? "#2dd4bf" : undefined }}>
                  {drift > 0 ? "+" : ""}{drift.toFixed(1)}%
                </span>
                <span className="text-right font-mono font-semibold" style={{ color: buyThb > 0 ? "#2dd4bf" : undefined }}>
                  {buyThb > 0 ? fmtThb(buyThb) : "–"}
                </span>
              </div>
            );
          })}
        </div>

        {cashThb > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Total: {fmtThb(normalizedUsd.reduce((s, b) => s + b, 0) * usdthbRate)} of {fmtThb(cashThb)}
          </p>
        )}
      </div>
    </div>
  );
}
