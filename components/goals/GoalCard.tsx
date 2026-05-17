"use client";

import { Target, GraduationCap, Home, Star, CheckCircle, AlertCircle } from "lucide-react";
import type { GoalResult } from "@/lib/calculations/goals";

export function GoalIcon({ type }: { type: string }) {
  const cls = "h-5 w-5 shrink-0";
  if (type === "retirement") return <Target className={cls} style={{ color: "var(--gold-500)" }} />;
  if (type === "education")  return <GraduationCap className={cls} style={{ color: "#60a5fa" }} />;
  if (type === "down_payment") return <Home className={cls} style={{ color: "#2dd4bf" }} />;
  return <Star className={cls} style={{ color: "#a78bfa" }} />;
}

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

interface Props {
  result: GoalResult;
  onEdit(): void;
}

export function GoalCard({ result, onEdit }: Props) {
  const {
    name, type, corpusNeeded, currentTrajectory, shortfall,
    requiredMonthlySavings, isOnTrack, percentProgress, targetAge, yearsToTarget,
  } = result;

  const fillPct = Math.min(100, percentProgress);

  return (
    <div
      className="mx-4 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${isOnTrack ? "#2dd4bf44" : "#fb718544"}` }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: isOnTrack ? "rgba(45,212,191,0.08)" : "rgba(251,113,133,0.08)" }}
      >
        <GoalIcon type={type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
          {targetAge && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              อีก {yearsToTarget} ปี (อายุ {targetAge})
            </p>
          )}
        </div>
        {isOnTrack ? (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#2dd4bf22", color: "#2dd4bf" }}>
            <CheckCircle className="h-3 w-3" /> บรรลุ
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fb718522", color: "#fb7185" }}>
            <AlertCircle className="h-3 w-3" /> ขาด
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2" style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
        <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: "var(--bg-surface)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${fillPct}%`, background: isOnTrack ? "#2dd4bf" : "#f59e0b" }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>คาดการณ์ {fmtBaht(currentTrajectory)}</span>
          <span>เป้าหมาย {fmtBaht(corpusNeeded)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-1" style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
        {shortfall > 0 ? (
          <>
            <p className="text-xs" style={{ color: "#fb7185" }}>
              ขาดอีก {fmtBaht(shortfall)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ต้องออมเพิ่ม{" "}
              <span className="font-bold" style={{ color: "var(--gold-500)" }}>
                {fmtBaht(requiredMonthlySavings)}/เดือน
              </span>
            </p>
          </>
        ) : (
          <p className="text-xs" style={{ color: "#2dd4bf" }}>
            เกินเป้า {fmtBaht(Math.abs(shortfall))} — คุณอยู่ในเส้นทางที่ดี!
          </p>
        )}
        <button
          type="button"
          className="text-xs mt-1"
          style={{ color: "var(--text-muted)" }}
          onClick={onEdit}
        >
          แก้ไข →
        </button>
      </div>
    </div>
  );
}
