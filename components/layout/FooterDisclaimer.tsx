"use client";

export function FooterDisclaimer() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 px-4 py-1.5 text-center"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
      }}
    >
      <p className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
        ข้อมูลนี้เพื่อการวางแผนเท่านั้น · ไม่ถือเป็นคำแนะนำการลงทุน · ผลตอบแทนในอดีตไม่รับประกันอนาคต
      </p>
    </div>
  );
}
