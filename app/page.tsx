import Link from "next/link";
import { ArrowRight, BarChart2, Shield, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Bridge Strategy",
    desc: "วางแผน gap ระหว่างเกษียณก่อนประกันสิ้นสุด แสดงเส้นทางรายได้ที่ต่อเนื่อง",
    color: "#fb7185",
  },
  {
    icon: TrendingUp,
    title: "UL Lifetime",
    desc: "จำลองมูลค่า Unit Link ตลอดชีพ พร้อมแผนถอนเงินและมรดก",
    color: "var(--gold-500)",
  },
  {
    icon: BarChart2,
    title: "Portfolio Projection",
    desc: "ประมาณการเติบโตพอร์ตลงทุน ภาพรวม Net Worth 30 ปีข้างหน้า",
    color: "#60a5fa",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-black tracking-tight" style={{ color: "var(--gold-500)", fontFamily: "var(--font-display)" }}>
          Lakoi Wealth
        </span>
        <Link
          href="/demo"
          className="text-sm font-medium px-4 py-2 rounded-full"
          style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-500)", border: "1px solid rgba(201,168,76,0.3)" }}
        >
          เข้าใช้งาน
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-12 text-center gap-6">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-500)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          สำหรับตัวแทนประกันและที่ปรึกษาการเงิน
        </div>

        <h1 className="text-3xl font-black leading-tight tracking-tight max-w-sm" style={{ fontFamily: "var(--font-display)" }}>
          เครื่องมือวางแผนการเงิน<br />
          <span style={{ color: "var(--gold-500)" }}>สำหรับตัวแทนยุคใหม่</span>
        </h1>

        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-secondary)" }}>
          สร้างภาพแผนการเงินที่ลูกค้าเข้าใจ ในไม่กี่นาที
          ออกแบบมาสำหรับการนำเสนอบน iPad
        </p>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg"
          style={{
            background: "var(--gold-500)",
            color: "#0a0e1a",
            boxShadow: "0 4px 24px rgba(201,168,76,0.4)",
          }}
        >
          ทดลองใช้ฟรี
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          ไม่ต้องสมัครสมาชิก · ข้อมูลอยู่บนเครื่องคุณ
        </p>
      </main>

      {/* Features */}
      <section className="px-5 pb-10 space-y-3 max-w-md mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-center mb-4" style={{ color: "var(--text-muted)" }}>
          ฟีเจอร์หลัก
        </p>
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="rounded-2xl p-4 flex items-start gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${color}1a` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © 2025 Lakoi Wealth · ข้อมูลทั้งหมดเป็นการคาดการณ์ มิใช่คำแนะนำการลงทุน
        </p>
      </footer>
    </div>
  );
}
