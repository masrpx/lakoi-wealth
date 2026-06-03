"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioAsset, DCAEntry, PriceData } from "@/types/growthPortfolio";
import { assetTotalUnits } from "@/lib/store/growthPortfolio";

interface Props {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  usdthbRate: number;
  onAddEntry: (e: DCAEntry) => void;
  onRemoveEntry: (id: string) => void;
}

function AddEntryForm({
  assetId,
  currentPriceThb,
  onAdd,
  onCancel,
}: {
  assetId: string;
  currentPriceThb?: number;
  onAdd: (e: DCAEntry) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState(currentPriceThb?.toFixed(2) ?? "");

  function handleAdd() {
    const amountThb = parseFloat(amount);
    const priceAtPurchase = parseFloat(price);
    if (!amountThb || !priceAtPurchase || !date) return;
    onAdd({
      id: crypto.randomUUID(),
      assetId,
      date,
      amountThb,
      priceAtPurchase,
      unitsAdded: amountThb / priceAtPurchase,
    });
    setAmount("");
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Amount (฿)</span>
        <Input type="number" placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-xs w-28 font-mono" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Price (฿)</span>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-8 text-xs w-32 font-mono" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Units</span>
        <div className="h-8 flex items-center text-xs font-mono px-2 rounded" style={{ border: "1px solid var(--border)", minWidth: 72 }}>
          {amount && price ? (parseFloat(amount) / parseFloat(price)).toFixed(6) : "–"}
        </div>
      </div>
      <Button size="sm" className="h-8 text-xs" style={{ background: "var(--gold-500)", color: "#0a0e1a" }} onClick={handleAdd}>
        Add
      </Button>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

export function DCALog({ assets, dcaEntries, priceCache, usdthbRate, onAddEntry, onRemoveEntry }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div className="px-4 pb-4">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold">DCA Log</p>
        </div>

        {assets.map((asset, i) => {
          const entries = dcaEntries.filter((e) => e.assetId === asset.id);
          const totalUnits = assetTotalUnits(asset.id, dcaEntries);
          const isOpen = expanded[asset.id];
          const currentPriceThb = priceCache[asset.ticker]?.price
            ? priceCache[asset.ticker].price * usdthbRate
            : undefined;

          return (
            <div key={asset.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: i % 2 === 0 ? "var(--background)" : "var(--card)" }}
                onClick={() => toggle(asset.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium">{asset.name}</span>
                  <span className="text-xs text-muted-foreground">{asset.ticker}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{entries.length} entries · </span>
                  <span className="text-xs font-mono">{totalUnits.toFixed(6)} units</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {entries.length > 0 && (
                    <div className="px-4 py-2">
                      <div className="grid text-xs text-muted-foreground pb-1" style={{ gridTemplateColumns: "100px 90px 100px 90px 24px" }}>
                        <span>Date</span>
                        <span className="text-right">Amount ฿</span>
                        <span className="text-right">Price ฿</span>
                        <span className="text-right">Units</span>
                        <span />
                      </div>
                      {entries.map((e) => (
                        <div key={e.id} className="grid items-center text-xs py-1" style={{ gridTemplateColumns: "100px 90px 100px 90px 24px", borderTop: "1px solid var(--border)" }}>
                          <span className="font-mono">{e.date}</span>
                          <span className="text-right font-mono">฿{e.amountThb.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                          <span className="text-right font-mono">฿{e.priceAtPurchase.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                          <span className="text-right font-mono">{e.unitsAdded.toFixed(6)}</span>
                          <button type="button" onClick={() => onRemoveEntry(e.id)} className="flex items-center justify-center opacity-40 hover:opacity-100">
                            <Trash2 className="h-3 w-3" style={{ color: "#fb7185" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {adding === asset.id ? (
                    <AddEntryForm
                      assetId={asset.id}
                      currentPriceThb={currentPriceThb}
                      onAdd={(e) => { onAddEntry(e); setAdding(null); }}
                      onCancel={() => setAdding(null)}
                    />
                  ) : (
                    <div className="px-4 pb-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAdding(asset.id)}>
                        <Plus className="h-3 w-3" /> Add Entry
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
