"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useGrowthPortfolioStore } from "@/lib/store/growthPortfolio";
import { computeAssetSignal } from "@/lib/calculations/indicators";
import { PortfolioGrid } from "@/components/growth-portfolio/PortfolioGrid";
import type { AssetSignal, PriceData } from "@/types/growthPortfolio";

function fmtThb(v: number): string {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  return `฿${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function GrowthPortfolioPage() {
  const {
    assets, dcaEntries, priceCache, usdthbRate,
    addAsset, updateAsset, removeAsset,
    setPrice, markPricesStale, setUsdthbRate,
  } = useGrowthPortfolioStore();

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    const [rateResult, ...assetResults] = await Promise.allSettled([
      fetch("/api/price/USDTHB%3DX").then(async (r) => {
        if (!r.ok) throw new Error("rate fetch failed");
        const d = (await r.json()) as PriceData;
        setUsdthbRate(d.price);
      }),
      ...assets.map(async (a) => {
        const res = await fetch(`/api/price/${encodeURIComponent(a.ticker)}`);
        if (!res.ok) throw new Error(`${a.ticker}: ${res.status}`);
        const data = (await res.json()) as PriceData;
        setPrice(a.ticker, data);
      }),
    ]);
    void rateResult;
    if (assetResults.some((r) => r.status === "fulfilled")) setLastUpdated(new Date());
    setLoading(false);
  }, [assets, setPrice, setUsdthbRate]);

  useEffect(() => {
    markPricesStale();
    fetchPrices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signals = useMemo<Record<string, AssetSignal>>(() => {
    const out: Record<string, AssetSignal> = {};
    for (const a of assets) {
      const pd = priceCache[a.ticker];
      if (pd && pd.closes.length > 0) {
        out[a.ticker] = computeAssetSignal(a.ticker, pd.closes, pd.highs, pd.price);
      }
    }
    return out;
  }, [assets, priceCache]);

  const totalThb = assets.reduce((sum, a) => {
    const pd = priceCache[a.ticker];
    const held = a.unitsHeld ?? 0;
    if (held > 0 && pd?.price) return sum + held * pd.price * usdthbRate;
    return sum + (a.manualValueTHB ?? 0);
  }, 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Sticky header */}
      <header
        className="flex items-center gap-4 px-4 py-3 sticky top-0 z-20"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Portfolio</p>
          <p className="text-xl font-semibold font-mono tabular-nums leading-tight" style={{ color: "var(--gold-500)" }}>
            {fmtThb(totalThb)}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">USD/THB</p>
          <p className="text-sm font-mono tabular-nums">{usdthbRate.toFixed(2)}</p>
        </div>
        <div className="text-right text-[10px] text-muted-foreground hidden sm:block">
          {loading ? "Fetching…" : lastUpdated ? lastUpdated.toLocaleTimeString() : "Not loaded"}
        </div>
        <button
          onClick={fetchPrices}
          disabled={loading}
          className="p-2 rounded-lg transition-opacity hover:opacity-60 disabled:opacity-30"
          style={{ minHeight: "unset" }}
          aria-label="Refresh prices"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        <PortfolioGrid
          assets={assets}
          dcaEntries={dcaEntries}
          priceCache={priceCache}
          signals={signals}
          usdthbRate={usdthbRate}
          onUpdateAsset={updateAsset}
          onAddAsset={addAsset}
          onRemoveAsset={removeAsset}
        />
      </div>
    </div>
  );
}
