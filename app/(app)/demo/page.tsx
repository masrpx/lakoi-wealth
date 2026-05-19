"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, RotateCcw, User, BarChart3, Shield, TrendingUp, Wallet, Target, GitCompare, Activity, Layers, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBalanceSheetStore } from "@/lib/store/balanceSheet";
import { useInsuranceStore } from "@/lib/store/insurance";
import { useGoalsStore } from "@/lib/store/goals";
import { useUIStore } from "@/lib/store/ui";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/data/demo-profiles";
import { demoData } from "@/lib/data/demo-data";

const NAV_ITEMS = [
  { href: "/balance-sheet",                   label: "งบดุล",         icon: Wallet },
  { href: "/cashflow",                         label: "กระแสเงินสด",  icon: BarChart3 },
  { href: "/portfolio",                        label: "พอร์ตลงทุน",   icon: TrendingUp },
  { href: "/insurance/endowment",              label: "สะสมทรัพย์",   icon: Shield },
  { href: "/insurance/health",                 label: "สุขภาพ",       icon: Shield },
  { href: "/insurance/unit-link",              label: "Unit Link",    icon: TrendingUp },
  { href: "/goals",                            label: "เป้าหมาย",     icon: Target },
  { href: "/use-cases/portfolio-projection",   label: "ภาพรวม",       icon: Activity },
  { href: "/use-cases/bridge",                 label: "Bridge",       icon: Layers },
  { href: "/use-cases/ul-lifetime",            label: "UL Lifetime",  icon: LineChart },
  { href: "/scenarios",                        label: "Scenarios",    icon: GitCompare },
  { href: "/profile",                          label: "โปรไฟล์",      icon: User },
];

function loadProfile(profile: DemoProfile) {
  const { seed } = useBalanceSheetStore.getState();
  const { loadPolicies } = useInsuranceStore.getState();
  const { loadGoals } = useGoalsStore.getState();
  seed({
    assets: profile.state.assets,
    liabilities: profile.state.liabilities,
    investments: profile.state.investments,
    customExpenses: profile.state.customExpenses ?? [],
    monthlyIncome: profile.state.personal.monthlyIncome,
    monthlyExpense: profile.state.personal.monthlyExpense,
    currentAge: profile.state.personal.currentAge,
    name: profile.state.personal.name,
  });
  loadPolicies(profile.state.insurance);
  loadGoals(profile.state.goals);
}

export default function DemoPage() {
  const router = useRouter();
  const { loadedProfileId, setLoadedProfileId } = useUIStore();

  function handleLoad(profile: DemoProfile) {
    loadProfile(profile);
    setLoadedProfileId(profile.id);
  }

  function handleReset() {
    const { seed } = useBalanceSheetStore.getState();
    const { loadPolicies } = useInsuranceStore.getState();
    const { loadGoals } = useGoalsStore.getState();
    seed({
      assets: demoData.assets,
      liabilities: demoData.liabilities,
      investments: demoData.investments,
      customExpenses: [],
      monthlyIncome: demoData.personal.monthlyIncome,
      monthlyExpense: demoData.personal.monthlyExpense,
      currentAge: demoData.personal.currentAge,
      name: demoData.personal.name,
    });
    loadPolicies(demoData.insurance);
    loadGoals(demoData.goals);
    setLoadedProfileId("default");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      <header
        className="flex items-center gap-3 px-5 py-3 sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">Demo Profiles</h1>
          <p className="text-xs text-muted-foreground">เลือกโปรไฟล์ลูกค้าตัวอย่างเพื่อสาธิต</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5 text-xs"
          style={{ border: "1.5px solid rgba(201,168,76,0.4)", color: "var(--gold-500)" }}
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          ค่าเริ่มต้น
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Profile cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">เลือกโปรไฟล์</p>
          {DEMO_PROFILES.map((profile) => {
            const isLoaded = loadedProfileId === profile.id;
            return (
              <div
                key={profile.id}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{
                  background: "var(--bg-surface)",
                  border: isLoaded
                    ? `1.5px solid ${profile.colorVar}`
                    : "1px solid var(--border)",
                  transition: "border 0.2s",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
                  style={{ background: `${profile.colorVar}22`, color: profile.colorVar }}
                >
                  {profile.label[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{profile.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.subtitle}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: profile.colorVar }}>
                    {profile.state.personal.name}
                  </p>
                </div>

                <Button
                  size="sm"
                  className="shrink-0 text-xs h-9 px-3"
                  style={
                    isLoaded
                      ? { background: `${profile.colorVar}22`, color: profile.colorVar, border: `1px solid ${profile.colorVar}` }
                      : { background: "var(--bg-elevated)", color: "var(--text-secondary)" }
                  }
                  onClick={() => handleLoad(profile)}
                >
                  {isLoaded ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      โหลดแล้ว
                    </span>
                  ) : (
                    "โหลด"
                  )}
                </Button>
              </div>
            );
          })}

          {/* Default client reset info */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: "var(--bg-surface)",
              border: loadedProfileId === "default" ? "1.5px solid var(--border)" : "1px solid var(--border)",
              opacity: 0.7,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-elevated)" }}
            >
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">ค่าเริ่มต้น (สมชาย ใจดี)</p>
              <p className="text-xs text-muted-foreground mt-0.5">35 ปี · 150,000/เดือน · ใช้กับทุกฟีเจอร์</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs h-9 px-3"
              onClick={handleReset}
            >
              รีเซ็ต
            </Button>
          </div>
        </div>

        {/* Module navigation */}
        {loadedProfileId && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ไปที่โมดูล</p>
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  type="button"
                  className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                  onClick={() => router.push(href)}
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--gold-500)" }} />
                  <span className="text-xs font-medium leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loadedProfileId && (
          <div
            className="rounded-xl px-4 py-3 text-xs text-center"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            เลือกโปรไฟล์ด้านบนเพื่อเริ่มสาธิต
          </div>
        )}
      </div>
    </div>
  );
}
