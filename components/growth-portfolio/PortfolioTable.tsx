"use client";

import type { PortfolioAsset, PriceData, DCAEntry, AssetSignal } from "@/types/growthPortfolio";
import { assetCurrentValue } from "@/lib/store/growthPortfolio";

interface Props {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  signals: Record<string, AssetSignal>;
  usdthbRate: number;
}

const SIGNAL_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  BUY:   { bg: "rgba(45,212,191,0.12)", color: "#2dd4bf", label: "BUY" },
  HOLD:  { bg: "rgba(201,168,76,0.12)", color: "#c9a84c", label: "HOLD" },
  AVOID: { bg: "rgba(251,113,133,0.12)", color: "#fb7185", label: "AVOID" },
};

function fmtPriceThb(usdPrice: number, rate: number) {
  const thb = usdPrice * rate;
  if (thb >= 1_000_000) return `฿${(thb / 1_000_000).toFixed(2)}M`;
  if (thb >= 1_000) return `฿${thb.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `฿${thb.toFixed(2)}`;
}

export function PortfolioTable({ assets, dcaEntries, priceCache, signals, usdthbRate }: Props) {
  const totalValueUsd = assets.reduce((sum, a) => {
    const pd = priceCache[a.ticker];
    return sum + assetCurrentValue(a.id, a.manualValueTHB, dcaEntries, pd?.price, usdthbRate);
  }, 0);

  return (
    <div className="px-4 pb-2">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div
          className="grid text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2"
          style={{ gridTemplateColumns: "1fr 70px 55px 75px 45px 45px 45px 60px", background: "var(--muted)" }}
        >
          <span>Asset</span>
          <span className="text-right">Price ฿</span>
          <span className="text-right">24h%</span>
          <span className="text-right">Value ฿</span>
          <span className="text-right">Act%</span>
          <span className="text-right">Tgt%</span>
          <span className="text-right">Drift</span>
          <span className="text-right">Signal</span>
        </div>

        {assets.map((asset, i) => {
          const pd = priceCache[asset.ticker];
          const price = pd?.price;
          const currentValueUsd = assetCurrentValue(asset.id, asset.manualValueTHB, dcaEntries, price, usdthbRate);
          const currentValueThb = currentValueUsd * usdthbRate;
          const actualWeight = totalValueUsd > 0 ? (currentValueUsd / totalValueUsd) * 100 : 0;
          const drift = actualWeight - asset.targetWeight;
          const change24h = pd ? ((pd.price - pd.prevClose) / pd.prevClose) * 100 : null;
          const signal = signals[asset.ticker];
          const signalStyle = signal ? SIGNAL_STYLE[signal.composite] : null;

          return (
            <div
              key={asset.id}
              className="grid items-center px-3 py-2.5 text-sm"
              style={{
                gridTemplateColumns: "1fr 70px 55px 75px 45px 45px 45px 60px",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
                background: i % 2 === 0 ? "var(--background)" : "var(--card)",
              }}
            >
              <div>
                <p className="font-medium leading-tight text-xs">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.ticker}</p>
              </div>

              <p className="text-right text-xs font-mono">
                {price !== undefined ? fmtPriceThb(price, usdthbRate) : pd?.stale ? "–" : "…"}
              </p>

              <p
                className="text-right text-xs font-mono"
                style={{ color: change24h === null ? undefined : change24h >= 0 ? "#2dd4bf" : "#fb7185" }}
              >
                {change24h !== null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "–"}
              </p>

              <p className="text-right text-xs font-mono">
                {currentValueThb > 0
                  ? `฿${currentValueThb.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : "–"}
              </p>

              <p className="text-right text-xs">{actualWeight.toFixed(1)}%</p>
              <p className="text-right text-xs text-muted-foreground">{asset.targetWeight}%</p>

              <p
                className="text-right text-xs font-medium"
                style={{ color: Math.abs(drift) < 1 ? undefined : drift > 0 ? "#fb7185" : "#2dd4bf" }}
              >
                {drift > 0 ? "+" : ""}{drift.toFixed(1)}%
              </p>

              {signalStyle ? (
                <div className="flex justify-end">
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: signalStyle.bg, color: signalStyle.color }}
                  >
                    {signalStyle.label}
                  </span>
                </div>
              ) : (
                <p className="text-right text-xs text-muted-foreground">–</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
