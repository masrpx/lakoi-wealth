"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { PortfolioAsset, PriceData, DCAEntry, AssetSignal } from "@/types/growthPortfolio";
import { assetValueUsd, assetTotalUnits } from "@/lib/store/growthPortfolio";
import { rebalAction } from "@/lib/calculations/rules";

const BUCKET_DOT: Record<string, string> = {
  Core: "#60a5fa",
  Growth: "#2dd4bf",
  Hedge: "#a78bfa",
  Speculative: "#fb7185",
};
const SIG_STYLE: Record<string, { bg: string; fg: string }> = {
  BUY:   { bg: "rgba(45,212,191,0.12)", fg: "#2dd4bf" },
  HOLD:  { bg: "rgba(201,168,76,0.12)", fg: "#c9a84c" },
  AVOID: { bg: "rgba(251,113,133,0.12)", fg: "#fb7185" },
};

function fmtThb(v: number): string {
  if (v === 0) return "–";
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(3)}M`;
  return `฿${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtUnits(n: number): string {
  if (n <= 0) return "–";
  if (n < 0.001) return n.toFixed(8);
  if (n < 1) return n.toFixed(6);
  if (n < 1000) return n.toFixed(4);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

interface Props {
  asset: PortfolioAsset;
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  totalValueUsd: number;
  signal: AssetSignal | undefined;
  usdthbRate: number;
  even: boolean;
  onUpdateAsset: (id: string, patch: Partial<PortfolioAsset>) => void;
  onRemoveAsset: (id: string) => void;
}

const GRID = "grid-cols-[1fr_82px_50px_110px_92px_46px_70px_50px_56px_28px]";
const CH = "text-[10px] uppercase tracking-widest text-muted-foreground";

export function PortfolioRow({ asset, dcaEntries, priceCache, totalValueUsd, signal, usdthbRate, even, onUpdateAsset, onRemoveAsset }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"units" | "thb">("units");
  const [editValue, setEditValue] = useState("");

  const isCrypto = asset.ticker.endsWith("-USD");
  const hasBreakdown = isCrypto && (asset.hardWalletUnits !== undefined || asset.exchangeUnits !== undefined);
  const cryptoUnits = (asset.hardWalletUnits ?? 0) + (asset.exchangeUnits ?? 0);
  const coinTicker = asset.ticker.split("-")[0];

  const pd = priceCache[asset.ticker];
  const price = pd?.price;
  const valueUsd = assetValueUsd(asset, dcaEntries, price, usdthbRate);
  const valueThb = valueUsd * usdthbRate;
  const units = hasBreakdown
    ? cryptoUnits
    : (asset.unitsHeld ?? 0) > 0 ? (asset.unitsHeld ?? 0) : assetTotalUnits(asset.id, dcaEntries);
  const actualPct = totalValueUsd > 0 ? (valueUsd / totalValueUsd) * 100 : 0;
  const drift = actualPct - asset.targetWeight;
  const change24 = pd ? ((pd.price - pd.prevClose) / pd.prevClose) * 100 : null;
  const sig = signal ? SIG_STYLE[signal.composite] : null;

  function openEdit() {
    const manualThb = asset.manualValueTHB ?? 0;
    if (units > 0) {
      setEditValue(String(units));
      setEditMode("units");
    } else if (manualThb > 0) {
      setEditValue(String(manualThb));
      setEditMode("thb");
    } else {
      setEditValue("");
      setEditMode("units");
    }
    setIsEditing(true);
  }

  function commit() {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      if (editMode === "units") {
        onUpdateAsset(asset.id, { unitsHeld: parsed });
      } else if (price !== undefined && usdthbRate > 0) {
        onUpdateAsset(asset.id, { unitsHeld: parsed / usdthbRate / price });
      } else {
        onUpdateAsset(asset.id, { manualValueTHB: parsed, unitsHeld: 0 });
      }
    }
    setIsEditing(false);
  }

  function updateBreakdown(field: "hardWalletUnits" | "exchangeUnits", raw: string) {
    const val = raw.trim();
    onUpdateAsset(asset.id, { [field]: val === "" ? undefined : parseFloat(val) || 0 });
  }

  const rowBg = even ? "var(--background)" : "var(--card)";
  const mh = { minHeight: "unset" } as const;
  const driftColor = Math.abs(drift) < 1.5 ? "var(--muted-foreground)" : drift > 0 ? "#fb7185" : "#2dd4bf";
  const action = asset.bucket !== "Hedge" ? rebalAction(actualPct, asset.targetWeight, asset.bucket) : null;
  const actionStyle = action === "TRIM"
    ? { bg: "rgba(251,113,133,0.12)", fg: "#fb7185" }
    : action === "ADD"
      ? { bg: "rgba(45,212,191,0.12)", fg: "#2dd4bf" }
      : null;

  return (
    <div style={{ background: rowBg, borderBottom: "1px solid var(--border)" }}>
      {/* ── Desktop ── */}
      <div className={`hidden md:grid items-center gap-x-2 px-4 py-2.5 ${GRID}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BUCKET_DOT[asset.bucket] }} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{asset.name}</p>
            <p className={`${CH} font-mono normal-case`}>{asset.ticker}</p>
          </div>
        </div>

        <p className="text-right text-xs font-mono tabular-nums">
          {price !== undefined ? fmtThb(price * usdthbRate) : <span className="text-muted-foreground">…</span>}
        </p>

        <p className="text-right text-xs font-mono tabular-nums" style={{ color: change24 === null ? "var(--muted-foreground)" : change24 >= 0 ? "#2dd4bf" : "#fb7185" }}>
          {change24 !== null ? `${change24 >= 0 ? "+" : ""}${change24.toFixed(1)}%` : "–"}
        </p>

        {/* Holdings — crypto with breakdown: show sum only; others: click-to-edit */}
        <div className="flex flex-col items-end justify-center gap-0.5">
          {isCrypto ? (
            <span className="text-xs font-mono tabular-nums" style={{ color: units > 0 ? "inherit" : "var(--muted-foreground)" }}>
              {units > 0 ? fmtUnits(units) : "–"}
            </span>
          ) : isEditing ? (
            <>
              <div className="flex gap-0.5">
                {(["units", "thb"] as const).map((m) => (
                  <button key={m} onMouseDown={(e) => { e.preventDefault(); setEditMode(m); }} style={{ ...mh, background: editMode === m ? "var(--gold-500)" : "var(--muted)", color: editMode === m ? "#fff" : "var(--muted-foreground)" }} className="text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors">
                    {m === "units" ? "# units" : "฿ value"}
                  </button>
                ))}
              </div>
              <input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setIsEditing(false); }}
                className="w-24 text-right text-xs font-mono bg-transparent outline-none border-b-2 py-0.5"
                style={{ ...mh, borderColor: "var(--gold-500)" }}
              />
            </>
          ) : (
            <button onClick={openEdit} style={mh} className="text-right hover:opacity-60 transition-opacity">
              {units > 0 ? (
                <span className="text-xs font-mono tabular-nums">{fmtUnits(units)}</span>
              ) : (
                <span className="text-xs" style={{ color: "var(--gold-500)" }}>+ set</span>
              )}
            </button>
          )}
        </div>

        <p className="text-right text-sm font-mono font-semibold tabular-nums" style={{ color: "var(--gold-500)" }}>
          {fmtThb(valueThb)}
        </p>

        <p className="text-right text-xs font-mono tabular-nums text-muted-foreground">{actualPct.toFixed(1)}%</p>

        <div className="flex items-center justify-end gap-0.5">
          <input type="number" min={0} max={100} step={0.5} value={asset.targetWeight}
            onChange={(e) => onUpdateAsset(asset.id, { targetWeight: parseFloat(e.target.value) || 0 })}
            className="w-10 text-right text-xs font-mono bg-transparent outline-none border-b"
            style={{ ...mh, borderColor: "var(--border)" }}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <p className="text-xs font-mono tabular-nums font-medium" style={{ color: driftColor }}>
            {drift > 0 ? "+" : ""}{drift.toFixed(1)}%
          </p>
          {actionStyle && (
            <span className="text-[9px] font-bold px-1 py-px rounded leading-none" style={{ background: actionStyle.bg, color: actionStyle.fg }}>
              {action}
            </span>
          )}
        </div>

        {sig ? (
          <div className="flex justify-end">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ ...mh, background: sig.bg, color: sig.fg }}>
              {signal?.composite}
            </span>
          </div>
        ) : (
          <p className="text-right text-[10px] text-muted-foreground">–</p>
        )}

        <button
          type="button"
          onClick={() => onRemoveAsset(asset.id)}
          style={mh}
          className="flex justify-end opacity-25 hover:opacity-80 transition-opacity"
          aria-label={`Remove ${asset.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: "#fb7185" }} />
        </button>
      </div>

      {/* ── Crypto breakdown sub-row (desktop) ── */}
      {isCrypto && (
        <div
          className="hidden md:flex items-center gap-3 px-4 py-2"
          style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.12)" }}
        >
          <span className="text-[9px] uppercase tracking-wider shrink-0" style={{ color: "rgba(201,168,76,0.5)", minWidth: "5rem" }}>
            {coinTicker} Custody
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Hard Wallet</span>
            <input
              type="number"
              value={asset.hardWalletUnits ?? ""}
              placeholder="0"
              onChange={(e) => updateBreakdown("hardWalletUnits", e.target.value)}
              className="w-28 text-right font-mono bg-transparent outline-none border-b py-0.5"
              style={{ ...mh, borderColor: "rgba(201,168,76,0.35)", fontSize: "11px" }}
            />
            <span className="text-xs text-muted-foreground">+</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Exchange</span>
            <input
              type="number"
              value={asset.exchangeUnits ?? ""}
              placeholder="0"
              onChange={(e) => updateBreakdown("exchangeUnits", e.target.value)}
              className="w-28 text-right font-mono bg-transparent outline-none border-b py-0.5"
              style={{ ...mh, borderColor: "rgba(45,212,191,0.35)", fontSize: "11px" }}
            />
            <span className="text-xs text-muted-foreground">=</span>
            <span
              className="font-mono font-semibold tabular-nums"
              style={{ color: "var(--gold-500)", fontSize: "12px", minWidth: "90px", textAlign: "right" }}
            >
              {fmtUnits(cryptoUnits)} {coinTicker}
            </span>
          </div>
        </div>
      )}

      {/* ── Mobile ── */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: BUCKET_DOT[asset.bucket] }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{asset.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{asset.ticker}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isCrypto && (
              <button onClick={openEdit} style={mh}>
                <span className="text-xs font-mono" style={{ color: units > 0 ? "var(--muted-foreground)" : "var(--gold-500)" }}>
                  {units > 0 ? fmtUnits(units) : "set"}
                </span>
              </button>
            )}
            <p className="text-sm font-mono font-semibold tabular-nums" style={{ color: "var(--gold-500)" }}>{fmtThb(valueThb)}</p>
            <div className="flex items-center gap-0.5">
              <input type="number" min={0} max={100} step={0.5} value={asset.targetWeight}
                onChange={(e) => onUpdateAsset(asset.id, { targetWeight: parseFloat(e.target.value) || 0 })}
                className="w-9 text-right text-xs font-mono bg-transparent outline-none border-b"
                style={{ ...mh, borderColor: "var(--border)" }}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveAsset(asset.id)}
              style={mh}
              className="opacity-25 hover:opacity-80 transition-opacity"
              aria-label={`Remove ${asset.name}`}
            >
              <Trash2 className="h-4 w-4" style={{ color: "#fb7185" }} />
            </button>
          </div>
        </div>
        {!isCrypto && isEditing && (
          <div className="flex items-center gap-2 mt-2">
            {(["units", "thb"] as const).map((m) => (
              <button key={m} onMouseDown={(e) => { e.preventDefault(); setEditMode(m); }} style={{ ...mh, background: editMode === m ? "var(--gold-500)" : "var(--muted)", color: editMode === m ? "#fff" : "var(--muted-foreground)" }} className="text-[10px] font-mono px-2 py-1 rounded transition-colors">
                {m === "units" ? "# units" : "฿ value"}
              </button>
            ))}
            <input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setIsEditing(false); }}
              className="flex-1 text-right text-sm font-mono bg-transparent outline-none border-b-2"
              style={{ ...mh, borderColor: "var(--gold-500)" }}
            />
          </div>
        )}
        {/* Crypto breakdown sub-row (mobile) */}
        {isCrypto && (
          <div className="mt-2 space-y-1.5 pt-2" style={{ borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-20 shrink-0">Hard Wallet</span>
              <input
                type="number"
                value={asset.hardWalletUnits ?? ""}
                placeholder="0"
                onChange={(e) => updateBreakdown("hardWalletUnits", e.target.value)}
                className="flex-1 text-right text-xs font-mono bg-transparent outline-none border-b"
                style={{ ...mh, borderColor: "rgba(201,168,76,0.35)" }}
              />
              <span className="text-[9px] text-muted-foreground">{coinTicker}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-20 shrink-0">Exchange</span>
              <input
                type="number"
                value={asset.exchangeUnits ?? ""}
                placeholder="0"
                onChange={(e) => updateBreakdown("exchangeUnits", e.target.value)}
                className="flex-1 text-right text-xs font-mono bg-transparent outline-none border-b"
                style={{ ...mh, borderColor: "rgba(45,212,191,0.35)" }}
              />
              <span className="text-[9px] text-muted-foreground">{coinTicker}</span>
            </div>
            <div className="flex justify-end pt-0.5">
              <span className="text-[9px] text-muted-foreground mr-2">Total</span>
              <span className="text-xs font-mono font-semibold" style={{ color: "var(--gold-500)" }}>
                {fmtUnits(cryptoUnits)} {coinTicker}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
