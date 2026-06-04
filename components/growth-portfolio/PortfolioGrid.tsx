"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { PortfolioAsset, PriceData, DCAEntry, AssetSignal, Bucket } from "@/types/growthPortfolio";
import { assetValueUsd } from "@/lib/store/growthPortfolio";
import { PortfolioRow } from "./PortfolioRow";

const BUCKETS: Bucket[] = ["Core", "Growth", "Hedge", "Speculative"];
const GRID = "grid-cols-[1fr_82px_50px_110px_92px_46px_70px_50px_56px]";
const CH = "text-[10px] uppercase tracking-widest text-muted-foreground select-none";

function fmtThb(v: number): string {
  if (v === 0) return "–";
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  return `฿${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface Props {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  signals: Record<string, AssetSignal>;
  usdthbRate: number;
  onUpdateAsset: (id: string, patch: Partial<PortfolioAsset>) => void;
  onAddAsset: (a: PortfolioAsset) => void;
  onRemoveAsset: (id: string) => void;
}

const EMPTY_NEW = { ticker: "", name: "", weight: "", bucket: "Growth" as Bucket };

export function PortfolioGrid({ assets, dcaEntries, priceCache, signals, usdthbRate, onUpdateAsset, onAddAsset, onRemoveAsset }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAsset, setNewAsset] = useState(EMPTY_NEW);

  const totalValueUsd = assets.reduce((sum, a) => {
    const pd = priceCache[a.ticker];
    return sum + assetValueUsd(a, dcaEntries, pd?.price, usdthbRate);
  }, 0);

  const totalTarget = assets.reduce((s, a) => s + a.targetWeight, 0);
  const targetOk = Math.abs(totalTarget - 100) < 0.1;

  function handleAdd() {
    if (!newAsset.ticker || !newAsset.name || !newAsset.weight) return;
    onAddAsset({
      id: crypto.randomUUID(),
      ticker: newAsset.ticker.toUpperCase(),
      name: newAsset.name,
      targetWeight: parseFloat(newAsset.weight) || 0,
      bucket: newAsset.bucket,
      manualValueTHB: 0,
      unitsHeld: 0,
    });
    setNewAsset(EMPTY_NEW);
    setShowAdd(false);
  }

  return (
    <div className="flex flex-col">
      {/* Column headers — desktop only */}
      <div
        className={`hidden md:grid items-center gap-x-2 px-4 py-2 sticky top-[57px] z-10 ${GRID}`}
        style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}
      >
        <span className={CH}>Asset</span>
        <span className={`${CH} text-right`}>Price ฿</span>
        <span className={`${CH} text-right`}>24h</span>
        <span className={`${CH} text-right`}>Holdings</span>
        <span className={`${CH} text-right`}>Value ฿</span>
        <span className={`${CH} text-right`}>Act%</span>
        <span className={`${CH} text-right`}>Target%</span>
        <span className={`${CH} text-right`}>Drift</span>
        <span className={`${CH} text-right`}>Sig</span>
      </div>

      {/* Rows */}
      {assets.map((asset, i) => (
        <PortfolioRow
          key={asset.id}
          asset={asset}
          dcaEntries={dcaEntries}
          priceCache={priceCache}
          totalValueUsd={totalValueUsd}
          signal={signals[asset.ticker]}
          usdthbRate={usdthbRate}
          even={i % 2 === 0}
          onUpdateAsset={onUpdateAsset}
        />
      ))}

      {/* Footer */}
      <div
        className={`hidden md:grid items-center gap-x-2 px-4 py-2.5 ${GRID}`}
        style={{ background: "var(--bg-elevated)", borderTop: "2px solid var(--border)" }}
      >
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Total</p>
        <span /><span /><span />
        <p className="text-right text-sm font-mono font-semibold tabular-nums" style={{ color: "var(--gold-500)" }}>
          {fmtThb(totalValueUsd * usdthbRate)}
        </p>
        <p className="text-right text-xs font-mono text-muted-foreground">100%</p>
        <p className="text-right text-xs font-mono font-semibold" style={{ color: targetOk ? "#2dd4bf" : "#fb7185" }}>
          {totalTarget.toFixed(1)}%{!targetOk && " ✗"}
        </p>
        <span /><span />
      </div>

      {/* Mobile footer */}
      <div className="md:hidden px-4 py-3 flex items-center justify-between" style={{ borderTop: "2px solid var(--border)", background: "var(--bg-elevated)" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
        <div className="flex items-center gap-4">
          <p className="text-sm font-mono font-semibold" style={{ color: "var(--gold-500)" }}>{fmtThb(totalValueUsd * usdthbRate)}</p>
          <p className="text-xs font-mono font-semibold" style={{ color: targetOk ? "#2dd4bf" : "#fb7185" }}>
            Tgt: {totalTarget.toFixed(1)}%{!targetOk && " ✗"}
          </p>
        </div>
      </div>

      {/* Add asset */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        {showAdd ? (
          <div className="flex flex-wrap gap-2 items-end">
            {[
              { label: "Ticker", value: newAsset.ticker, key: "ticker", placeholder: "AAPL", cls: "w-24 font-mono uppercase" },
              { label: "Name", value: newAsset.name, key: "name", placeholder: "Apple Inc.", cls: "w-40" },
              { label: "Target %", value: newAsset.weight, key: "weight", placeholder: "5", cls: "w-20 font-mono" },
            ].map(({ label, value, key, placeholder, cls }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
                <input
                  type={key === "weight" ? "number" : "text"}
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setNewAsset((p) => ({ ...p, [key]: e.target.value }))}
                  className={`h-9 text-sm border rounded-md px-2 bg-transparent outline-none focus:border-[var(--gold-500)] ${cls}`}
                  style={{ borderColor: "var(--border)", minHeight: "unset" }}
                />
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Bucket</span>
              <select value={newAsset.bucket} onChange={(e) => setNewAsset((p) => ({ ...p, bucket: e.target.value as Bucket }))}
                className="h-9 text-sm border rounded-md px-2 bg-transparent outline-none"
                style={{ borderColor: "var(--border)", background: "var(--card)", minHeight: "unset" }}
              >
                {BUCKETS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <button onClick={handleAdd} className="h-9 px-4 text-sm font-medium rounded-md transition-opacity hover:opacity-80" style={{ minHeight: "unset", background: "var(--gold-500)", color: "#0f172a" }}>
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="h-9 px-3 text-sm text-muted-foreground rounded-md border transition-opacity hover:opacity-70" style={{ minHeight: "unset", borderColor: "var(--border)" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:opacity-60 transition-opacity" style={{ minHeight: "unset" }}>
            <Plus className="h-3.5 w-3.5" />
            Add asset
          </button>
        )}
      </div>
    </div>
  );
}
