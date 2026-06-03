"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGrowthPortfolioStore } from "@/lib/store/growthPortfolio";
import { computeAssetSignal } from "@/lib/calculations/indicators";
import { SummaryCards } from "@/components/growth-portfolio/SummaryCards";
import { PortfolioTable } from "@/components/growth-portfolio/PortfolioTable";
import { RebalancerPanel } from "@/components/growth-portfolio/RebalancerPanel";
import { SignalPanel } from "@/components/growth-portfolio/SignalPanel";
import { DCALog } from "@/components/growth-portfolio/DCALog";
import { SettingsPanel } from "@/components/growth-portfolio/SettingsPanel";
import type { AssetSignal, PriceData } from "@/types/growthPortfolio";

export default function GrowthPortfolioPage() {
  const {
    assets, dcaEntries, priceCache, usdthbRate,
    addAsset, updateAsset, removeAsset,
    addDCAEntry, removeDCAEntry,
    setPrice, markPricesStale,
    setUsdthbRate,
    exportJSON, importJSON,
  } = useGrowthPortfolioStore();

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchPrices = useCallback(async () => {
    setLoading(true);

    // Fetch USDTHB rate in parallel with asset prices
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

    void rateResult; // rate failure is non-fatal — keeps previous value
    const anyOk = assetResults.some((r) => r.status === "fulfilled");
    if (anyOk) setLastUpdated(new Date());
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

  function handleExport() {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lakoi-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">Max&apos;s Growth Portfolio</h1>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Fetching prices…"
              : lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()} · 1 USD = ฿${usdthbRate.toFixed(2)}`
              : "Not yet loaded"}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setShowSettings((s) => !s)} aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={fetchPrices} disabled={loading} aria-label="Refresh prices">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {showSettings && (
          <SettingsPanel
            assets={assets}
            usdthbRate={usdthbRate}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onRemoveAsset={removeAsset}
            onSetUsdthb={setUsdthbRate}
            onExport={handleExport}
            onImport={importJSON}
          />
        )}

        <SummaryCards assets={assets} dcaEntries={dcaEntries} priceCache={priceCache} usdthbRate={usdthbRate} />

        <div className="px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio</p>
        </div>
        <PortfolioTable assets={assets} dcaEntries={dcaEntries} priceCache={priceCache} signals={signals} usdthbRate={usdthbRate} />

        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rebalancer</p>
        </div>
        <RebalancerPanel assets={assets} dcaEntries={dcaEntries} priceCache={priceCache} signals={signals} usdthbRate={usdthbRate} />

        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signals</p>
        </div>
        <SignalPanel assets={assets} priceCache={priceCache} signals={signals} />

        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DCA Log</p>
        </div>
        <DCALog assets={assets} dcaEntries={dcaEntries} priceCache={priceCache} usdthbRate={usdthbRate} onAddEntry={addDCAEntry} onRemoveEntry={removeDCAEntry} />
      </div>
    </div>
  );
}
