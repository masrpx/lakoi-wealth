"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { demoData } from "@/lib/data/demo-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sliderFill(value: number, min: number, max: number) {
  return { "--slider-fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

function fmtBaht(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</p>
      </div>
      <div className="px-4 py-4 space-y-4" style={{ background: "var(--bg-elevated)" }}>
        {children}
      </div>
    </div>
  );
}

function NumberInput({
  label, value, prefix, suffix, min, max, color = "var(--text-primary)",
  onChange,
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  min?: number; max?: number; color?: string;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <div>
      <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm font-semibold shrink-0" style={{ color }}>{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          className="flex-1 rounded-lg px-3 h-10 text-sm font-semibold outline-none"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color }}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { const n = Number(local); if (!isNaN(n) && (min === undefined || n >= min)) onChange(n); }}
        />
        {suffix && <span className="text-sm shrink-0" style={{ color }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Stepper({
  label, value, min, max, color = "var(--gold-500)", onChange,
}: {
  label: string; value: number; min: number; max: number; color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex items-center gap-2">
        <button type="button"
          className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color }}
          onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span className="w-10 text-center text-sm font-bold" style={{ color }}>{value}</span>
        <button type="button"
          className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color }}
          onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

function ModuleLink({ label, subtitle, href, color, comingSoon = false }: {
  label: string; subtitle?: string; href?: string; color: string; comingSoon?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid var(--border)`,
        opacity: comingSoon ? 0.5 : 1,
        cursor: comingSoon ? "default" : "pointer",
      }}
      onClick={() => !comingSoon && href && router.push(href)}
      disabled={comingSoon}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color }}>{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {comingSoon ? (
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#60a5fa22", color: "#60a5fa" }}>
          เร็ว ๆ นี้
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
      )}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const {
    name, currentAge, monthlyIncome, monthlyExpense,
    propertyGrowthRate, goldGrowthRate,
    setName, setProfile, setGrowthAssumptions, seed, assets, liabilities,
  } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();

  // Seed demo data if empty
  useEffect(() => {
    if (assets.length === 0 && liabilities.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35, name: "คุณสมชาย ใจดี", propertyGrowthRate: 3, goldGrowthRate: 0 });
    }
    if (policies.length === 0) loadPolicies(demoData.insurance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const income = monthlyIncome || 150000;
  const expense = monthlyExpense || 80000;
  const age = currentAge || 35;
  const propRate = propertyGrowthRate ?? 3;
  const goldRate = goldGrowthRate ?? 0;
  const monthlyNet = income - expense;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/demo")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight">โปรไฟล์ทางการเงิน</h1>
          <p className="text-xs text-muted-foreground">ข้อมูลใช้ร่วมกันทุกหน้า</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-4">
        {/* Section 1: Personal */}
        <Section title="บุคคล">
          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>ชื่อลูกค้า</p>
            <input
              className="w-full rounded-lg px-3 h-10 text-sm outline-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              placeholder="ชื่อ-นามสกุล"
              defaultValue={name}
              onBlur={(e) => setName(e.target.value)}
            />
          </div>
          <Stepper
            label="อายุปัจจุบัน (ปี)"
            value={age}
            min={18}
            max={80}
            onChange={(v) => setProfile(income, expense, v)}
          />
        </Section>

        {/* Section 2: Income & Expense */}
        <Section title="รายได้ / รายจ่าย">
          <NumberInput
            label="รายได้/เดือน"
            value={income}
            prefix="฿"
            color="#2dd4bf"
            min={0}
            onChange={(v) => setProfile(v, expense, age)}
          />
          <NumberInput
            label="ค่าใช้จ่าย/เดือน"
            value={expense}
            prefix="฿"
            color="#fb7185"
            min={0}
            onChange={(v) => setProfile(income, v, age)}
          />
          <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>สุทธิ/เดือน</span>
            <span className="text-sm font-bold" style={{ color: monthlyNet >= 0 ? "#2dd4bf" : "#fb7185" }}>
              {monthlyNet >= 0 ? "+" : ""}{fmtBaht(monthlyNet)}
            </span>
          </div>
        </Section>

        {/* Section 3: Growth assumptions */}
        <Section title="สมมติฐานการเติบโต">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>อสังหาฯ/ปี</span>
              <span className="text-sm font-bold" style={{ color: "#c9a84c" }}>{propRate.toFixed(1)}%</span>
            </div>
            <input type="range" value={propRate} min={0} max={10} step={0.5}
              className="w-full cursor-pointer"
              style={sliderFill(propRate, 0, 10)}
              onChange={(e) => setGrowthAssumptions(Number(e.target.value), goldRate)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>ทองคำ/ปี</span>
              <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{goldRate.toFixed(1)}%</span>
            </div>
            <input type="range" value={goldRate} min={0} max={5} step={0.5}
              className="w-full cursor-pointer"
              style={sliderFill(goldRate, 0, 5)}
              onChange={(e) => setGrowthAssumptions(propRate, Number(e.target.value))}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            ใช้สำหรับคำนวณมูลค่าสุทธิในอีก 30 ปี ที่หน้า ความมั่งคั่งสุทธิ
          </p>
        </Section>

        {/* Section 4: Module links */}
        <Section title="ข้อมูลทางการเงิน">
          <ModuleLink
            label="สินทรัพย์ & หนี้สิน"
            subtitle={`${assets.length} สินทรัพย์ · ${liabilities.length} หนี้สิน`}
            href="/balance-sheet"
            color="#2dd4bf"
          />
          <ModuleLink
            label="กรมธรรม์ประกัน"
            subtitle={`${policies.length} กรมธรรม์`}
            href="/insurance/endowment"
            color="#a78bfa"
          />
          <ModuleLink
            label="พอร์ตการลงทุน"
            subtitle="กองทุน, หุ้น, สินทรัพย์อื่น"
            color="#60a5fa"
            comingSoon
          />
          <ModuleLink
            label="เป้าหมายทางการเงิน"
            subtitle="เกษียณ, การศึกษา, บ้าน"
            color="var(--gold-500)"
            comingSoon
          />
        </Section>

        {/* Reset demo */}
        <div className="px-4 pb-8">
          <button
            type="button"
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            onClick={() => {
              seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35, name: "คุณสมชาย ใจดี", propertyGrowthRate: 3, goldGrowthRate: 0 });
              loadPolicies(demoData.insurance);
            }}
          >
            รีเซ็ตเป็นข้อมูลตัวอย่าง
          </button>
        </div>
      </div>
    </div>
  );
}
