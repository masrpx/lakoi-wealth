"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { projectNetWorth } from "@/lib/calculations/netWorth";
import { demoData } from "@/lib/data/demo-data";
import type { Asset, Liability, AssetCategory, LiabilityCategory } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSET_CATS: { value: AssetCategory; label: string; color: string }[] = [
  { value: "cash",       label: "เงินสด/ฝาก",  color: "#60a5fa" },
  { value: "property",   label: "อสังหาฯ",      color: "#c9a84c" },
  { value: "investment", label: "ลงทุน",         color: "#2dd4bf" },
  { value: "gold",       label: "ทองคำ",          color: "#f59e0b" },
  { value: "other",      label: "อื่น ๆ",        color: "#94a3b8" },
];

const LIABILITY_CATS: { value: LiabilityCategory; label: string }[] = [
  { value: "home_loan",     label: "สินเชื่อบ้าน" },
  { value: "car_loan",      label: "ผ่อนรถ" },
  { value: "personal_loan", label: "สินเชื่อส่วนบุคคล" },
  { value: "credit_card",   label: "บัตรเครดิต" },
  { value: "other",         label: "อื่น ๆ" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function fmtFull(n: number) {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

const catColor = (cat: AssetCategory) =>
  ASSET_CATS.find((c) => c.value === cat)?.color ?? "#94a3b8";

const catLabel = (cat: AssetCategory) =>
  ASSET_CATS.find((c) => c.value === cat)?.label ?? cat;

const liabCatLabel = (cat: LiabilityCategory) =>
  LIABILITY_CATS.find((c) => c.value === cat)?.label ?? cat;

// ── AssetForm ─────────────────────────────────────────────────────────────────

function AssetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Asset>;
  onSave: (a: Omit<Asset, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [value, setValue] = useState(String(initial?.value ?? ""));
  const [cat, setCat] = useState<AssetCategory>(initial?.category ?? "cash");

  return (
    <div className="p-4 rounded-xl mb-3 space-y-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--gold-500)" }}>
      <input
        className="w-full rounded-lg px-3 h-11 text-sm outline-none focus:ring-1"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        placeholder="ชื่อสินทรัพย์"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        className="w-full rounded-lg px-3 h-11 text-sm outline-none focus:ring-1"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        placeholder="มูลค่า (บาท)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {ASSET_CATS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: cat === c.value ? `${c.color}22` : "transparent",
              border: `1px solid ${cat === c.value ? c.color : "var(--border)"}`,
              color: cat === c.value ? c.color : "var(--text-muted)",
            }}
            onClick={() => setCat(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          style={{ background: "var(--gold-500)", color: "#000" }}
          onClick={() => { if (name.trim() && value) onSave({ name: name.trim(), value: Number(value), category: cat }); }}
        >
          บันทึก
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

// ── LiabilityForm ─────────────────────────────────────────────────────────────

function LiabilityForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Liability>;
  onSave: (l: Omit<Liability, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [total, setTotal] = useState(String(initial?.totalAmount ?? ""));
  const [monthly, setMonthly] = useState(String(initial?.monthlyPayment ?? ""));
  const [cat, setCat] = useState<LiabilityCategory>(initial?.category ?? "other");

  return (
    <div className="p-4 rounded-xl mb-3 space-y-3" style={{ background: "var(--bg-elevated)", border: "1px solid #fb7185" }}>
      <input
        className="w-full rounded-lg px-3 h-11 text-sm outline-none"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        placeholder="ชื่อหนี้สิน"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className="w-full rounded-lg px-3 h-11 text-sm outline-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          placeholder="ยอดคงเหลือ"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <input
          type="number"
          className="w-full rounded-lg px-3 h-11 text-sm outline-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          placeholder="จ่าย/เดือน"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {LIABILITY_CATS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: cat === c.value ? "#fb718522" : "transparent",
              border: `1px solid ${cat === c.value ? "#fb7185" : "var(--border)"}`,
              color: cat === c.value ? "#fb7185" : "var(--text-muted)",
            }}
            onClick={() => setCat(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          style={{ background: "#fb7185", color: "#fff" }}
          onClick={() => { if (name.trim() && total) onSave({ name: name.trim(), totalAmount: Number(total), monthlyPayment: Number(monthly), category: cat }); }}
        >
          บันทึก
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

// ── Allocation Pie ─────────────────────────────────────────────────────────────

function AllocationPie({ assets }: { assets: Asset[] }) {
  const data = useMemo(() => {
    const totals: Partial<Record<AssetCategory, number>> = {};
    for (const a of assets) totals[a.category] = (totals[a.category] ?? 0) + a.value;
    return ASSET_CATS.filter((c) => (totals[c.value] ?? 0) > 0).map((c) => ({
      name: c.label,
      value: totals[c.value]!,
      color: c.color,
    }));
  }, [assets]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="value" paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip
            formatter={(v) => [fmtFull(Number(v)), ""]}
            contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ display: "none" }}
            itemStyle={{ color: "var(--text-primary)", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 px-4 pb-3 justify-center">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            {d.name} {fmtBaht(d.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Snapshot View ─────────────────────────────────────────────────────────────

function SnapshotView({ snapshotAge }: { snapshotAge: number }) {
  const router = useRouter();
  const { assets, liabilities, monthlyIncome, monthlyExpense, currentAge, propertyGrowthRate, goldGrowthRate, investments } =
    useBalanceSheetStore();
  const { policies } = useInsuranceStore();

  const years = Math.max(1, snapshotAge - (currentAge || 35) + 1);
  const profile = {
    currentAge: currentAge || 35,
    monthlyIncome: monthlyIncome || 150000,
    monthlyExpense: monthlyExpense || 80000,
    propertyGrowthRate: propertyGrowthRate ?? 3,
    goldGrowthRate: goldGrowthRate ?? 0,
  };
  const snap = useMemo(
    () => projectNetWorth(profile, assets, liabilities, policies, investments, years).at(-1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshotAge, assets, liabilities, policies, investments, JSON.stringify(profile)]
  );
  if (!snap) return null;

  const totalA = snap.cash + snap.property + snap.investment + snap.gold + snap.insuranceCashValue + snap.other;
  const totalL = Math.abs(snap.liabilities);
  const assetPct = totalA + totalL > 0 ? (totalA / (totalA + totalL)) * 100 : 50;

  const categories: { label: string; value: number; color: string }[] = [
    { label: "เงินสด/ฝาก",      value: snap.cash,               color: "#60a5fa" },
    { label: "อสังหาฯ",          value: snap.property,            color: "#c9a84c" },
    { label: "ลงทุน",             value: snap.investment,          color: "#2dd4bf" },
    { label: "ทองคำ",             value: snap.gold,                color: "#f59e0b" },
    { label: "มูลค่ากรมธรรม์",   value: snap.insuranceCashValue,  color: "#a78bfa" },
    { label: "อื่น ๆ",           value: snap.other,               color: "#94a3b8" },
  ].filter((c) => c.value > 0);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">งบดุล</h1>
          <p className="text-xs text-muted-foreground">สินทรัพย์ · หนี้สิน · ความมั่งคั่งสุทธิ</p>
        </div>
      </header>

      {/* Snapshot banner */}
      <div className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: "#c9a84c18", borderBottom: "1px solid #c9a84c44" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--gold-500)" }} />
        <p className="text-xs font-semibold flex-1" style={{ color: "var(--gold-500)" }}>
          คาดการณ์ ณ อายุ {snapshotAge} ปี
        </p>
        <button type="button" className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => router.back()}>
          ← กลับ
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-2 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">สินทรัพย์รวม</p>
            <p className="text-base font-bold" style={{ color: "#2dd4bf" }}>{fmtBaht(totalA)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">ความมั่งคั่งสุทธิ</p>
            <p className="text-lg font-bold font-display" style={{ color: snap.netWorth >= 0 ? "var(--gold-500)" : "#fb7185" }}>
              {fmtBaht(snap.netWorth)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">หนี้สินรวม</p>
            <p className="text-base font-bold" style={{ color: "#fb7185" }}>{fmtBaht(totalL)}</p>
          </div>
        </div>

        {/* Balance bar */}
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs w-14 text-right" style={{ color: "#2dd4bf" }}>สินทรัพย์</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#fb718533" }}>
              <div className="h-full rounded-full" style={{ width: `${assetPct}%`, background: "#2dd4bf" }} />
            </div>
            <span className="text-xs w-14" style={{ color: "#fb7185" }}>หนี้สิน</span>
          </div>
        </div>

        {/* Projected asset categories */}
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#2dd4bf" }}>สินทรัพย์ (ตามประเภท)</h2>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{c.label}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: c.color }}>{fmtFull(c.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projected liabilities */}
        <div className="px-5 pt-3 pb-10">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#fb7185" }}>หนี้สิน</h2>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>ยอดหนี้คงเหลือรวม</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: "#fb7185" }}>{fmtFull(totalL)}</p>
          </div>
          <p className="text-xs mt-3 text-center text-muted-foreground">
            แสดงมูลค่าคาดการณ์ · แตะ ← เพื่อกลับสู่มูลค่าปัจจุบัน
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

function BalanceSheetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snapshotAge = searchParams.get("snapshot") ? Number(searchParams.get("snapshot")) : null;

  const {
    assets, liabilities,
    addAsset, updateAsset, removeAsset,
    addLiability, updateLiability, removeLiability,
    seed,
  } = useBalanceSheetStore();

  // Show projected snapshot if query param present
  if (snapshotAge !== null) return <SnapshotView snapshotAge={snapshotAge} />;

  const [addingAsset, setAddingAsset] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [addingLiab, setAddingLiab] = useState(false);
  const [editingLiabId, setEditingLiabId] = useState<string | null>(null);
  const [deleteLiabId, setDeleteLiabId] = useState<string | null>(null);

  useEffect(() => {
    if (assets.length === 0 && liabilities.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAssets = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets]);
  const totalLiab = useMemo(() => liabilities.reduce((s, l) => s + l.totalAmount, 0), [liabilities]);
  const netWorth = totalAssets - totalLiab;
  const totalMonthlyDebt = useMemo(() => liabilities.reduce((s, l) => s + l.monthlyPayment, 0), [liabilities]);
  const assetPct = totalAssets + totalLiab > 0 ? (totalAssets / (totalAssets + totalLiab)) * 100 : 50;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight">งบดุล</h1>
          <p className="text-xs text-muted-foreground">สินทรัพย์ · หนี้สิน · ความมั่งคั่งสุทธิ</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">สินทรัพย์รวม</p>
            <p className="text-base font-bold" style={{ color: "#2dd4bf" }}>{fmtBaht(totalAssets)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">ความมั่งคั่งสุทธิ</p>
            <p className="text-lg font-bold font-display" style={{ color: netWorth >= 0 ? "var(--gold-500)" : "#fb7185" }}>
              {fmtBaht(netWorth)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">หนี้สินรวม</p>
            <p className="text-base font-bold" style={{ color: "#fb7185" }}>{fmtBaht(totalLiab)}</p>
          </div>
        </div>

        {/* Balance bar */}
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs w-14 text-right" style={{ color: "#2dd4bf" }}>สินทรัพย์</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#fb718533" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${assetPct}%`, background: "#2dd4bf" }} />
            </div>
            <span className="text-xs w-14" style={{ color: "#fb7185" }}>หนี้สิน</span>
          </div>
          <div className="flex justify-between px-14">
            <span className="text-xs font-semibold" style={{ color: "#2dd4bf" }}>{assetPct.toFixed(0)}%</span>
            <span className="text-xs text-muted-foreground">ผ่อน/เดือน {fmtBaht(totalMonthlyDebt)}</span>
            <span className="text-xs font-semibold" style={{ color: "#fb7185" }}>{(100 - assetPct).toFixed(0)}%</span>
          </div>
        </div>

        {/* Assets */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center mb-3">
            <h2 className="text-sm font-semibold flex-1" style={{ color: "#2dd4bf" }}>
              สินทรัพย์{" "}
              <span className="text-xs font-normal text-muted-foreground">{assets.length} รายการ</span>
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#2dd4bf22", color: "#2dd4bf", border: "1px solid #2dd4bf44" }}
              onClick={() => { setAddingAsset(true); setEditingAssetId(null); }}
            >
              <Plus className="h-3 w-3" /> เพิ่ม
            </button>
          </div>

          <AllocationPie assets={assets} />

          {addingAsset && (
            <AssetForm
              onSave={(data) => { addAsset({ ...data, id: crypto.randomUUID() }); setAddingAsset(false); }}
              onCancel={() => setAddingAsset(false)}
            />
          )}

          <div className="space-y-2">
            {assets.map((asset) =>
              editingAssetId === asset.id ? (
                <AssetForm
                  key={asset.id}
                  initial={asset}
                  onSave={(data) => { updateAsset(asset.id, data); setEditingAssetId(null); }}
                  onCancel={() => setEditingAssetId(null)}
                />
              ) : (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColor(asset.category) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{asset.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{catLabel(asset.category)}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: "#2dd4bf" }}>{fmtFull(asset.value)}</p>
                  <div className="flex gap-0.5">
                    <button type="button" className="p-1.5 rounded" style={{ color: "var(--text-muted)" }}
                      onClick={() => { setEditingAssetId(asset.id); setAddingAsset(false); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {deleteAssetId === asset.id ? (
                      <button type="button" className="p-1.5 rounded" style={{ color: "#fb7185" }}
                        onClick={() => { removeAsset(asset.id); setDeleteAssetId(null); }}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button type="button" className="p-1.5 rounded" style={{ color: "var(--text-muted)" }}
                        onClick={() => setDeleteAssetId(asset.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
            {assets.length === 0 && !addingAsset && (
              <p className="text-sm text-center py-6 text-muted-foreground">ยังไม่มีสินทรัพย์ — กด เพิ่ม เพื่อเริ่ม</p>
            )}
          </div>
        </div>

        {/* Liabilities */}
        <div className="px-5 pt-4 pb-10">
          <div className="flex items-center mb-3">
            <h2 className="text-sm font-semibold flex-1" style={{ color: "#fb7185" }}>
              หนี้สิน{" "}
              <span className="text-xs font-normal text-muted-foreground">{liabilities.length} รายการ</span>
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#fb718522", color: "#fb7185", border: "1px solid #fb718544" }}
              onClick={() => { setAddingLiab(true); setEditingLiabId(null); }}
            >
              <Plus className="h-3 w-3" /> เพิ่ม
            </button>
          </div>

          {addingLiab && (
            <LiabilityForm
              onSave={(data) => { addLiability({ ...data, id: crypto.randomUUID() }); setAddingLiab(false); }}
              onCancel={() => setAddingLiab(false)}
            />
          )}

          <div className="space-y-2">
            {liabilities.map((liab) =>
              editingLiabId === liab.id ? (
                <LiabilityForm
                  key={liab.id}
                  initial={liab}
                  onSave={(data) => { updateLiability(liab.id, data); setEditingLiabId(null); }}
                  onCancel={() => setEditingLiabId(null)}
                />
              ) : (
                <div
                  key={liab.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{liab.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {liabCatLabel(liab.category)} · จ่าย {fmtBaht(liab.monthlyPayment)}/เดือน
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: "#fb7185" }}>{fmtFull(liab.totalAmount)}</p>
                  <div className="flex gap-0.5">
                    <button type="button" className="p-1.5 rounded" style={{ color: "var(--text-muted)" }}
                      onClick={() => { setEditingLiabId(liab.id); setAddingLiab(false); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {deleteLiabId === liab.id ? (
                      <button type="button" className="p-1.5 rounded" style={{ color: "#fb7185" }}
                        onClick={() => { removeLiability(liab.id); setDeleteLiabId(null); }}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button type="button" className="p-1.5 rounded" style={{ color: "var(--text-muted)" }}
                        onClick={() => setDeleteLiabId(liab.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
            {liabilities.length === 0 && !addingLiab && (
              <p className="text-sm text-center py-6 text-muted-foreground">ยังไม่มีหนี้สิน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BalanceSheetPage() {
  return (
    <Suspense>
      <BalanceSheetContent />
    </Suspense>
  );
}
