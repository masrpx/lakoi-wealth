"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { demoData } from "@/lib/data/demo-data";
import { yearlyPremiumForPolicy } from "@/lib/calculations/cashflow";
import { calcThai } from "@/lib/calculations/tax";

function fmtBaht(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `฿${(abs / 1_000).toFixed(0)}K`;
  return `฿${Math.round(abs).toLocaleString("th-TH")}`;
}

function sliderFill(v: number, min: number, max: number) {
  return { "--slider-fill": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

export default function TaxPage() {
  const router = useRouter();
  const { monthlyIncome, currentAge, assets, seed } = useBalanceSheetStore();
  const { policies, loadPolicies } = useInsuranceStore();
  const [ssf, setSsf] = useState(0);
  const [rmf, setRmf] = useState(0);

  useEffect(() => {
    if (assets.length === 0) {
      seed({ assets: demoData.assets, liabilities: demoData.liabilities, monthlyIncome: 150000, monthlyExpense: 80000, currentAge: 35 });
    }
    if (policies.length === 0) loadPolicies(demoData.insurance);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = currentAge || 35;
  const annualIncome = (monthlyIncome || 150000) * 12;

  const premiums = useMemo(() => {
    let life = 0;
    let health = 0;
    for (const p of policies) {
      const yr = yearlyPremiumForPolicy(p, age);
      if (p.type === "health") health += yr;
      else life += yr;
    }
    return { life, health };
  }, [policies, age]);

  const result = useMemo(
    () => calcThai({ annualIncome, lifeInsurancePremium: premiums.life, healthInsurancePremium: premiums.health, ssf, rmf }),
    [annualIncome, premiums, ssf, rmf]
  );

  const maxSsf = Math.min(annualIncome * 0.30, 200_000);
  const maxRmf = Math.min(annualIncome * 0.30, 500_000);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">วางแผนภาษี</h1>
          <p className="text-xs text-muted-foreground">ลดหย่อนภาษีเงินได้บุคคลธรรมดา</p>
        </div>
        <Receipt className="h-5 w-5 shrink-0" style={{ color: "var(--gold-500)" }} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 space-y-4">
        {/* Tax saved hero */}
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(45,212,191,0.08)", border: "1px solid #2dd4bf44" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>ประหยัดภาษีได้</p>
          <p className="text-3xl font-black" style={{ color: "#2dd4bf" }}>{fmtBaht(result.taxSaved)}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            ภาษีที่ต้องจ่าย <span style={{ color: "#fb7185" }}>{fmtBaht(result.taxWithDeductions)}</span>
            {" "}· อัตราภาษีที่แท้จริง <span style={{ color: "var(--gold-500)" }}>{result.effectiveRate.toFixed(1)}%</span>
          </p>
        </div>

        {/* Deductions from policies */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ลดหย่อนจากประกัน (ปีนี้)</p>
          </div>
          <div className="px-4 py-3 space-y-2" style={{ background: "var(--bg-elevated)" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>ประกันชีวิต (ลดหย่อนได้สูงสุด ฿100K)</span>
              <span style={{ color: "#2dd4bf" }}>{fmtBaht(result.lifeInsuranceDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>ประกันสุขภาพ (สูงสุด ฿25K)</span>
              <span style={{ color: "#2dd4bf" }}>{fmtBaht(result.healthInsuranceDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Investment deductions (sliders) */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ลดหย่อนจากการลงทุน</p>
          </div>
          <div className="px-4 py-3 space-y-4" style={{ background: "var(--bg-elevated)" }}>
            {[
              { label: "SSF (สูงสุด 30% หรือ ฿200K)", val: ssf, set: setSsf, max: maxSsf },
              { label: "RMF (สูงสุด 30% หรือ ฿500K)", val: rmf, set: setRmf, max: maxRmf },
            ].map(({ label, val, set, max }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ color: "#60a5fa" }}>{fmtBaht(val)}</span>
                </div>
                <input type="range" min={0} max={Math.ceil(max / 10000) * 10000} step={5000}
                  value={val} className="w-full cursor-pointer"
                  style={sliderFill(val, 0, Math.ceil(max / 10000) * 10000)}
                  onChange={(e) => set(Number(e.target.value))} />
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text-muted)" }}>รวมลดหย่อนการลงทุน</span>
              <span style={{ color: "#2dd4bf" }}>{fmtBaht(result.investmentDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Tax bracket table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>ขั้นบันไดภาษี</p>
          </div>
          <div style={{ background: "var(--bg-elevated)" }}>
            {result.brackets.map((b, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <span className="text-xs font-mono" style={{ color: "var(--gold-500)" }}>{b.rate}%</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>฿{b.taxableInBracket.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
                <span className="text-xs font-semibold" style={{ color: "#fb7185" }}>{fmtBaht(b.tax)}</span>
              </div>
            ))}
            {result.brackets.length === 0 && (
              <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>รายได้อยู่ในวงเล็บ 0% ไม่ต้องเสียภาษี</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
