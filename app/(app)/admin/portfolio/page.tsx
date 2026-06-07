"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Cloud, CloudOff } from "lucide-react";
import { useGrowthPortfolioStore, assetValueUsd } from "@/lib/store/growthPortfolio";
import { computeAssetSignal } from "@/lib/calculations/indicators";
import { PortfolioGrid } from "@/components/growth-portfolio/PortfolioGrid";
import { PlaybookPanel } from "@/components/growth-portfolio/PlaybookPanel";
import type { AssetSignal, DCAEntry, PriceData } from "@/types/growthPortfolio";

function fmtThb(v: number): string {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(3)}M`;
  return `฿${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

type SyncStatus = "idle" | "loading" | "synced" | "error";

export default function GrowthPortfolioPage() {
  const {
    assets, dcaEntries, priceCache, usdthbRate,
    addAsset, updateAsset, removeAsset, addDCAEntry,
    setPrice, markPricesStale, setUsdthbRate,
    importJSON, exportJSON,
  } = useGrowthPortfolioStore();

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDone = useRef(false);
  const justLoaded = useRef(false);

  // On mount: load from blob (cloud → localStorage)
  useEffect(() => {
    async function loadFromCloud() {
      setSyncStatus("loading");
      try {
        const res = await fetch("/api/portfolio/sync");
        const data = await res.json();
        if (data) {
          justLoaded.current = true;
          importJSON(JSON.stringify(data));
        } else {
          await fetch("/api/portfolio/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: exportJSON(),
          });
        }
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      } finally {
        initialSyncDone.current = true;
      }
    }
    loadFromCloud();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On any portfolio change: debounced save to blob
  useEffect(() => {
    if (!initialSyncDone.current) return;
    if (justLoaded.current) { justLoaded.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncStatus("loading");
      try {
        await fetch("/api/portfolio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: exportJSON(),
        });
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    }, 2000);
  }, [assets, dcaEntries, usdthbRate]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAddDCA(entry: Omit<DCAEntry, "id">) {
    const asset = assets.find(a => a.id === entry.assetId);
    if (!asset) return;
    addDCAEntry({ ...entry, id: crypto.randomUUID() });
    const hasCryptoBreakdown = asset.hardWalletUnits !== undefined || asset.exchangeUnits !== undefined;
    if (hasCryptoBreakdown) {
      updateAsset(entry.assetId, { exchangeUnits: Math.max(0, (asset.exchangeUnits ?? 0) + entry.unitsAdded) });
    } else if ((asset.unitsHeld ?? 0) > 0) {
      updateAsset(entry.assetId, { unitsHeld: Math.max(0, (asset.unitsHeld ?? 0) + entry.unitsAdded) });
    }
    // Pure DCA-entry assets (unitsHeld=0, no breakdown): DCAEntry alone updates the total
  }

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
    const anyPriceFetched = assetResults.some((r) => r.status === "fulfilled");
    if (anyPriceFetched) setLastUpdated(new Date());
    setLoading(false);
    if (anyPriceFetched && initialSyncDone.current) {
      setSyncStatus("loading");
      fetch("/api/portfolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: exportJSON(),
      })
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }
  }, [assets, setPrice, setUsdthbRate, exportJSON]);

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
    return sum + assetValueUsd(a, dcaEntries, pd?.price, usdthbRate) * usdthbRate;
  }, 0);

  const totalValueUsd = totalThb / (usdthbRate || 1);

  const btcAsset = assets.find((a) => a.ticker === "BTC-USD");
  const btcActualPct = useMemo(() => {
    if (!btcAsset || totalValueUsd <= 0) return 0;
    const pd = priceCache["BTC-USD"];
    return (assetValueUsd(btcAsset, dcaEntries, pd?.price, usdthbRate) / totalValueUsd) * 100;
  }, [btcAsset, dcaEntries, priceCache, usdthbRate, totalValueUsd]);

  const hedgeActualPct = useMemo(() => {
    if (totalValueUsd <= 0) return 0;
    return assets
      .filter((a) => a.bucket === "Hedge")
      .reduce((sum, a) => {
        const pd = priceCache[a.ticker];
        return sum + (assetValueUsd(a, dcaEntries, pd?.price, usdthbRate) / totalValueUsd) * 100;
      }, 0);
  }, [assets, dcaEntries, priceCache, usdthbRate, totalValueUsd]);

  const hedgeTargetWeight = assets.filter((a) => a.bucket === "Hedge").reduce((s, a) => s + a.targetWeight, 0);
  const btcTargetWeight = btcAsset?.targetWeight ?? 21;

  const syncIcon = syncStatus === "loading" ? (
    <Cloud className="h-3.5 w-3.5 animate-pulse" style={{ color: "var(--gold-500)" }} />
  ) : syncStatus === "synced" ? (
    <Cloud className="h-3.5 w-3.5" style={{ color: "#2dd4bf" }} />
  ) : syncStatus === "error" ? (
    <CloudOff className="h-3.5 w-3.5" style={{ color: "#fb7185" }} />
  ) : null;

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
        <div className="flex items-center gap-1.5 text-right text-[10px] text-muted-foreground hidden sm:block">
          {loading ? "Fetching…" : lastUpdated ? lastUpdated.toLocaleTimeString() : "Not loaded"}
        </div>
        {syncIcon && (
          <div className="flex items-center" title={syncStatus === "error" ? "Sync failed" : syncStatus === "loading" ? "Saving…" : "Synced"}>
            {syncIcon}
          </div>
        )}
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
          onAddDCA={handleAddDCA}
        />
        <PlaybookPanel
          btcActualPct={btcActualPct}
          btcTargetWeight={btcTargetWeight}
          hedgeActualPct={hedgeActualPct}
          hedgeTargetWeight={hedgeTargetWeight}
          spyData={priceCache["SPY"]}
        />
      </div>
    </div>
  );
}
