"use client";

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

interface NetSavingsBarProps {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  view: "monthly" | "yearly";
  onEdit: () => void;
}

export function NetSavingsBar({ totalIncome, totalExpenses, net, view, onEdit }: NetSavingsBarProps) {
  const isDeficit = net < 0;
  const fillPct = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 100;
  const periodLabel = view === "monthly" ? "/เดือน" : "/ปี";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 px-5 py-3"
      style={{
        background: "var(--bg-elevated)",
        borderTop: `1.5px solid ${isDeficit ? "#fb7185" : "var(--gold-500)"}`,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Progress bar */}
      <div className="mb-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${fillPct}%`,
            background: isDeficit ? "#fb7185" : "#2dd4bf",
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDeficit ? "#fb7185" : "var(--gold-500)" }}>
            {isDeficit ? "ขาดดุล" : "คงเหลือ"}{periodLabel}
          </p>
          <p className="text-lg font-bold font-display" style={{ color: isDeficit ? "#fb7185" : "#2dd4bf" }}>
            {fmtBaht(Math.abs(net))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>รายรับ {fmtBaht(totalIncome)}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>รายจ่าย {fmtBaht(totalExpenses)}</p>
        </div>
        <button
          type="button"
          className="text-xs px-3 py-2 rounded-lg shrink-0"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          onClick={onEdit}
        >
          แก้ไข →
        </button>
      </div>
    </div>
  );
}
