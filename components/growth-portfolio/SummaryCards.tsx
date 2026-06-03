"use client";

import type { PortfolioAsset, PriceData } from "@/types/growthPortfolio";
import { assetCurrentValue } from "@/lib/store/growthPortfolio";
import type { DCAEntry } from "@/types/growthPortfolio";

interface Props {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  usdthbRate: number;
}

const BUCKET_COLORS: Record<string, string> = {
  Core: "#60a5fa",
  Growth: "#2dd4bf",
  Hedge: "#a78bfa",
  Speculative: "#fb7185",
};

export function SummaryCards({ assets, dcaEntries, priceCache, usdthbRate }: Props) {
  const assetValues = assets.map((a) => ({
    ...a,
    currentValue: assetCurrentValue(a.id, a.manualValueTHB, dcaEntries, priceCache[a.ticker]?.price, usdthbRate),
  }));

  const totalValue = assetValues.reduce((sum, a) => sum + a.currentValue, 0);
  const totalThb = totalValue * usdthbRate;

  const maxDrift = assetValues.reduce(
    (worst, a) => {
      if (totalValue === 0) return worst;
      const actual = (a.currentValue / totalValue) * 100;
      const drift = actual - a.targetWeight;
      return Math.abs(drift) > Math.abs(worst.drift) ? { name: a.name, drift } : worst;
    },
    { name: "-", drift: 0 }
  );

  const buckets = ["Core", "Growth", "Hedge", "Speculative"];
  const bucketActual = Object.fromEntries(
    buckets.map((b) => {
      const val = assetValues.filter((a) => a.bucket === b).reduce((s, a) => s + a.currentValue, 0);
      return [b, totalValue > 0 ? (val / totalValue) * 100 : 0];
    })
  );
  const bucketTarget = Object.fromEntries(
    buckets.map((b) => [
      b,
      assets.filter((a) => a.bucket === b).reduce((s, a) => s + a.targetWeight, 0),
    ])
  );

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-3">
      {/* Total Value */}
      <div className="rounded-2xl p-4 col-span-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Portfolio</p>
        <p className="text-2xl font-bold mt-1" style={{ color: "var(--gold-500)", fontFamily: "var(--font-display)" }}>
          ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          ≈ ฿{totalThb.toLocaleString("en-US", { maximumFractionDigits: 0 })} · @{usdthbRate} THB/USD
        </p>
      </div>

      {/* Drift Alert */}
      <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Biggest Drift</p>
        <p className="text-sm font-semibold mt-1 leading-tight">{maxDrift.name}</p>
        <p
          className="text-lg font-bold"
          style={{ color: maxDrift.drift > 0 ? "#fb7185" : "#2dd4bf" }}
        >
          {maxDrift.drift > 0 ? "+" : ""}
          {maxDrift.drift.toFixed(1)}%
        </p>
      </div>

      {/* Bucket Breakdown */}
      <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Buckets</p>
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <div key={b} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: BUCKET_COLORS[b] }} />
                <span className="text-xs">{b}</span>
              </div>
              <span className="text-xs font-medium">
                {bucketActual[b].toFixed(0)}%
                <span className="text-muted-foreground"> / {bucketTarget[b]}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
