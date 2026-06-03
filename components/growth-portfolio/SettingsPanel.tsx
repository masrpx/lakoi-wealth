"use client";

import { useRef, useState } from "react";
import { Trash2, Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioAsset, Bucket } from "@/types/growthPortfolio";

const BUCKETS: Bucket[] = ["Core", "Growth", "Hedge", "Speculative"];

const BUCKET_COLOR: Record<Bucket, string> = {
  Core:        "#60a5fa",
  Growth:      "#2dd4bf",
  Hedge:       "#a78bfa",
  Speculative: "#fb7185",
};

interface Props {
  assets: PortfolioAsset[];
  usdthbRate: number;
  onAddAsset: (a: PortfolioAsset) => void;
  onUpdateAsset: (id: string, u: Partial<PortfolioAsset>) => void;
  onRemoveAsset: (id: string) => void;
  onSetUsdthb: (rate: number) => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

function NewAssetForm({ onAdd }: { onAdd: (a: PortfolioAsset) => void }) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [bucket, setBucket] = useState<Bucket>("Growth");

  function handleAdd() {
    if (!ticker || !name || !weight) return;
    onAdd({ id: crypto.randomUUID(), ticker: ticker.toUpperCase(), name, targetWeight: parseFloat(weight), bucket, manualValueTHB: 0 });
    setTicker(""); setName(""); setWeight("");
  }

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--background)", border: "1px dashed var(--border)" }}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Asset</p>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ticker</span>
          <Input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" className="h-9 w-24 font-mono uppercase" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." className="h-9 w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Target %</span>
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="5" className="h-9 w-20 font-mono" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Bucket</span>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)} className="h-9 text-sm rounded-md px-2" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
            {BUCKETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <Button size="sm" className="h-9 gap-1.5" style={{ background: "var(--gold-500)", color: "#0a0e1a" }} onClick={handleAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}

export function SettingsPanel({ assets, usdthbRate, onAddAsset, onUpdateAsset, onRemoveAsset, onSetUsdthb, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const totalWeight = assets.reduce((s, a) => s + a.targetWeight, 0);

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { onImport(ev.target?.result as string); } catch { /* malformed */ }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="px-4 pb-6">
      <div className="rounded-2xl p-4 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold">Settings</p>

        {/* USDTHB */}
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1">
            <span className="text-sm">USD/THB</span>
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>auto</span>
          </div>
          <span className="text-xs text-muted-foreground">Override:</span>
          <Input type="number" value={usdthbRate} onChange={(e) => onSetUsdthb(parseFloat(e.target.value) || 35)} className="h-9 w-24 font-mono" />
        </div>

        {/* Asset cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assets</p>
            <p className="text-xs" style={{ color: Math.abs(totalWeight - 100) < 0.01 ? "#2dd4bf" : "#fb7185" }}>
              Total: {totalWeight}%{Math.abs(totalWeight - 100) >= 0.01 ? " ≠ 100%" : " ✓"}
            </p>
          </div>

          {assets.map((a) => (
            <div key={a.id} className="rounded-xl p-3 space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              {/* Row 1: identity */}
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm w-20 shrink-0">{a.ticker}</span>
                <Input
                  value={a.name}
                  onChange={(e) => onUpdateAsset(a.id, { name: e.target.value })}
                  className="h-8 text-sm flex-1 min-w-0"
                />
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${BUCKET_COLOR[a.bucket]}1a`, color: BUCKET_COLOR[a.bucket] }}
                >
                  {a.bucket}
                </span>
                <button type="button" onClick={() => onRemoveAsset(a.id)} className="shrink-0 opacity-40 hover:opacity-100">
                  <Trash2 className="h-4 w-4" style={{ color: "#fb7185" }} />
                </button>
              </div>

              {/* Row 2: numbers */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Target %</span>
                  <Input
                    type="number"
                    value={a.targetWeight}
                    onChange={(e) => onUpdateAsset(a.id, { targetWeight: parseFloat(e.target.value) || 0 })}
                    className="h-9 w-20 font-mono text-right"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Value ฿</span>
                  <Input
                    type="number"
                    value={a.manualValueTHB || ""}
                    placeholder="0"
                    onChange={(e) => onUpdateAsset(a.id, { manualValueTHB: parseFloat(e.target.value) || 0 })}
                    className="h-9 flex-1 font-mono text-right"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Bucket</span>
                  <select
                    value={a.bucket}
                    onChange={(e) => onUpdateAsset(a.id, { bucket: e.target.value as Bucket })}
                    className="h-9 text-sm rounded-md px-2"
                    style={{ border: "1px solid var(--border)", background: "var(--card)" }}
                  >
                    {BUCKETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <NewAssetForm onAdd={onAddAsset} />

        {/* Export / Import */}
        <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={onExport}>
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
        </div>
      </div>
    </div>
  );
}
