"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { btcZone, crashLevel, spyDrawdownPct, nextThesisReview, type BtcZone } from "@/lib/calculations/rules";
import type { PriceData } from "@/types/growthPortfolio";
import { compute52wHigh } from "@/lib/calculations/indicators";

const CRASH_ROWS = [
  { level: 1, label: "−10%", action: "เติม SPY / KKP US500",          color: "#c9a84c" },
  { level: 2, label: "−20%", action: "เติม GOOG / NVDA",               color: "#fb7185" },
  { level: 3, label: "−30%", action: "เติม BTC / SPY",                 color: "#fb7185" },
  { level: 4, label: "−40%", action: "ใช้เงินก้อนใหญ่ เฉพาะ thesis ไม่พัง", color: "#a78bfa" },
];

const BTC_ROWS = [
  { zone: "ADD" as BtcZone,          label: "< add threshold",  action: "เติมกลับ target",         color: "#2dd4bf" },
  { zone: "HOLD" as BtcZone,         label: "Hold zone",        action: "ถือ ไม่ต้องทำอะไร",         color: "var(--muted-foreground)" },
  { zone: "TRIM" as BtcZone,         label: "> trim threshold", action: "trim 20–30% ของส่วนเกิน",  color: "#fb7185" },
  { zone: "TRIM_URGENT" as BtcZone,  label: "> urgent",        action: "trim จริงจัง ทันที",         color: "#a78bfa" },
];

const ZONE_STYLE: Record<BtcZone, { bg: string; fg: string; label: string }> = {
  ADD:          { bg: "rgba(45,212,191,0.12)",  fg: "#2dd4bf",   label: "ADD" },
  HOLD:         { bg: "rgba(201,168,76,0.12)",  fg: "#c9a84c",   label: "HOLD" },
  TRIM:         { bg: "rgba(251,113,133,0.12)", fg: "#fb7185",   label: "TRIM" },
  TRIM_URGENT:  { bg: "rgba(167,139,250,0.15)", fg: "#a78bfa",   label: "TRIM !" },
};

const IRON_RULES = [
  "ลง RMF ก่อนเสมอ ไม่เกิน 41,667 ฿/เดือน",
  "DCA วันที่ 1 ของเดือน อัตโนมัติ — ไม่ดูราคา ไม่รอ dip",
  "SGOV deploy ตาม crash rule เท่านั้น",
  "SOFI thesis แตก → ตัดทันที เงินเข้า VXUS",
  "Rebalance ปีละ 1 ครั้ง หรือเมื่อ asset drift เกิน band",
  "ห้ามตัดสินใจใหญ่ตอน emotional wave — รอ 48 ชั่วโมงก่อน",
  "Review thesis GOOG/NVDA/SOFI ทุก 6 เดือน (ม.ค. + ก.ค.)",
];

interface Props {
  btcActualPct: number;
  btcTargetWeight: number;
  hedgeActualPct: number;
  hedgeTargetWeight: number;
  spyData: PriceData | undefined;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-opacity hover:opacity-70"
        style={{ minHeight: "unset" }}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function PlaybookPanel({ btcActualPct, btcTargetWeight, hedgeActualPct, hedgeTargetWeight, spyData }: Props) {
  const [open, setOpen] = useState(false);

  const spy52w = spyData ? compute52wHigh(spyData.highs) : 0;
  const spyPrice = spyData?.price ?? 0;
  const level = crashLevel(spy52w, spyPrice);
  const drawdown = spyDrawdownPct(spy52w, spyPrice);
  const zone = btcZone(btcActualPct, btcTargetWeight);
  const zoneStyle = ZONE_STYLE[zone];
  const review = useMemo(() => nextThesisReview(new Date()), []);

  const alertCount = (level > 0 ? 1 : 0) + (zone !== "HOLD" ? 1 : 0);

  return (
    <div style={{ borderTop: "2px solid var(--border)", background: "var(--bg-elevated)" }}>
      {/* Panel toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-opacity hover:opacity-70"
        style={{ minHeight: "unset" }}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Playbook</span>
        {alertCount > 0 && (
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(251,113,133,0.15)", color: "#fb7185" }}>
            {alertCount} alert{alertCount > 1 ? "s" : ""}
          </span>
        )}
        {/* Always-visible summary */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {spyData && (
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
              SPY {drawdown < 1 ? "ATH zone" : `−${drawdown.toFixed(1)}% from 52wH`}
              {level > 0 && <span style={{ color: "#fb7185" }}>{" "}L{level}</span>}
            </span>
          )}
          <span className="text-[10px] font-mono tabular-nums">
            BTC <span style={{ color: zoneStyle.fg }}>{zoneStyle.label}</span>
          </span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Live status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3">
            {/* SPY crash level */}
            <div className="rounded-lg p-3" style={{ background: "var(--bg-surface, var(--card))", border: "1px solid var(--border)" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">S&P 500 vs 52w High</p>
              <p className="text-lg font-mono font-bold tabular-nums" style={{ color: level === 0 ? "#2dd4bf" : level <= 2 ? "#c9a84c" : "#fb7185" }}>
                {drawdown < 0.5 ? "ATH" : `−${drawdown.toFixed(1)}%`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {level === 0 ? "No crash rule active" : `Level ${level} — ${CRASH_ROWS[level - 1]?.action}`}
              </p>
            </div>

            {/* BTC zone */}
            <div className="rounded-lg p-3" style={{ background: "var(--bg-surface, var(--card))", border: "1px solid var(--border)" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">BTC Position</p>
              <p className="text-lg font-mono font-bold tabular-nums" style={{ color: zoneStyle.fg }}>
                {btcActualPct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Target {btcTargetWeight}% — zone: <span style={{ color: zoneStyle.fg }}>{zoneStyle.label}</span>
              </p>
            </div>

            {/* Hedge */}
            <div className="rounded-lg p-3" style={{ background: "var(--bg-surface, var(--card))", border: "1px solid var(--border)" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Hedge Combined</p>
              <p className="text-lg font-mono font-bold tabular-nums" style={{ color: hedgeActualPct > hedgeTargetWeight * 1.43 ? "#fb7185" : hedgeActualPct < hedgeTargetWeight * 0.71 ? "#2dd4bf" : "#c9a84c" }}>
                {hedgeActualPct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Target {hedgeTargetWeight.toFixed(1)}% · trim &gt;{(hedgeTargetWeight * 1.43).toFixed(0)}% add &lt;{(hedgeTargetWeight * 0.71).toFixed(0)}%
              </p>
            </div>

            {/* Thesis review */}
            <div className="rounded-lg p-3" style={{ background: "var(--bg-surface, var(--card))", border: "1px solid var(--border)" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Thesis Review</p>
              <p className="text-lg font-mono font-bold tabular-nums" style={{ color: review.daysUntil <= 30 ? "#c9a84c" : "inherit" }}>
                {review.daysUntil}d
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{review.label} · GOOG · NVDA · SOFI</p>
            </div>
          </div>

          <Section title="Market Crash Deployment">
            <p className="text-[10px] text-muted-foreground mb-2">วัด drawdown จาก S&P 500 52w high · ใช้ SGOV เป็นกระสุนหลัก</p>
            <div className="space-y-1">
              {CRASH_ROWS.map((r) => (
                <div key={r.level} className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs ${level === r.level ? "ring-1" : ""}`}
                  style={{ background: level === r.level ? `${r.color}18` : "transparent" }}>
                  <span className="font-mono font-bold w-8 shrink-0" style={{ color: r.color }}>{r.label}</span>
                  <span className="text-muted-foreground">{r.action}</span>
                  {level === r.level && <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${r.color}25`, color: r.color }}>ACTIVE</span>}
                </div>
              ))}
            </div>
          </Section>

          <Section title="BTC Position Rules">
            <div className="space-y-1">
              {BTC_ROWS.map((r) => (
                <div key={r.zone} className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs ${zone === r.zone ? "ring-1" : ""}`}
                  style={{ background: zone === r.zone ? `${r.color}18` : "transparent" }}>
                  <span className="font-mono text-[10px] shrink-0 w-20" style={{ color: r.color }}>{r.label}</span>
                  <span className="text-muted-foreground">{r.action}</span>
                  {zone === r.zone && <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${r.color}25`, color: r.color }}>NOW</span>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">ถ้า BTC วิ่ง 3x แล้วไม่ trim → พอร์ตกลายเป็น crypto portfolio โดยไม่รู้ตัว</p>
          </Section>

          <Section title="Thesis Review — Jan + Jul">
            <p className="text-[10px] text-muted-foreground mb-2">GOOG · NVDA · SOFI — ถามทุก 6 เดือน:</p>
            <ol className="space-y-1">
              {["Thesis ยังจริงไหม? เหตุผลที่ซื้อยังใช้ได้ หรือ environment เปลี่ยนแล้ว?",
                "ราคาขึ้นเพราะอะไร? Earnings growth จริง หรือแค่ multiple expansion?",
                "ถ้าซื้อใหม่วันนี้ กล้าไหม?"
              ].map((q, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="font-mono shrink-0" style={{ color: "var(--gold-500)" }}>{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
            <p className="text-[10px] text-muted-foreground mt-2">ถ้าตอบไม่ได้ชัด → ลดน้ำหนัก ไม่ใช่นั่งอวยตัวเอง</p>
          </Section>

          <Section title="Iron Rules">
            <ol className="space-y-1.5">
              {IRON_RULES.map((rule, i) => (
                <li key={i} className="flex gap-2.5 text-xs">
                  <span className="font-mono font-bold shrink-0 tabular-nums" style={{ color: "var(--gold-500)", minWidth: "1.25rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] mt-3 text-center text-muted-foreground italic" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              พอร์ต 8/10 คือพอร์ตที่เลือกสินทรัพย์ดี — พอร์ต 10/10 คือพอร์ตที่เจ้าของไม่ทำลายมันตอนกลัวหรือโลภ
            </p>
          </Section>
        </div>
      )}
    </div>
  );
}
