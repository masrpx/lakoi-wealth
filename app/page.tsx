"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Shield,
  TrendingUp,
  Wallet,
  Target,
  GitCompare,
  ArrowRight,
  Sparkles,
  User,
} from "lucide-react";

const navItems = [
  { href: "/(app)/profile", label: "Profile", icon: User },
  { href: "/(app)/balance-sheet", label: "Balance Sheet", icon: Wallet },
  { href: "/(app)/cashflow", label: "กระแสเงินสด", icon: BarChart3 },
  { href: "/(app)/insurance/endowment", label: "Endowment", icon: Shield },
  { href: "/(app)/insurance/health", label: "Health", icon: Shield },
  { href: "/(app)/insurance/unit-link", label: "Unit Link", icon: TrendingUp },
  { href: "/(app)/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/(app)/goals", label: "Goals", icon: Target },
  { href: "/(app)/scenarios", label: "Scenarios", icon: GitCompare },
];

const colors = [
  { hex: "#f0d080", label: "Gold 300", sub: "hover" },
  { hex: "#c9a84c", label: "Gold 500", sub: "primary actions" },
  { hex: "#8b7530", label: "Gold 700", sub: "pressed" },
  { hex: "#2dd4bf", label: "Teal 500", sub: "income · growth" },
  { hex: "#fb7185", label: "Rose 500", sub: "expense · premium" },
  { hex: "#60a5fa", label: "Blue 500", sub: "investments" },
  { hex: "#a78bfa", label: "Purple 500", sub: "tertiary" },
  { hex: "#0a0e1a", label: "BG Base", sub: "#0a0e1a" },
  { hex: "#111827", label: "BG Surface", sub: "#111827" },
  { hex: "#1a2236", label: "BG Elevated", sub: "#1a2236" },
];

const typeSizes = [
  { name: "4xl · 48px", cls: "text-5xl", sample: "฿1,200,000" },
  { name: "3xl · 36px", cls: "text-4xl", sample: "ได้รับเงินคืน" },
  { name: "2xl · 28px", cls: "text-3xl", sample: "Insurance Portfolio" },
  { name: "xl  · 22px", cls: "text-2xl", sample: "Unit Link Lifetime" },
  { name: "lg  · 18px", cls: "text-xl",  sample: "Premium per year ฿80,000" },
  { name: "base · 16px", cls: "text-base", sample: "Age 35 — ฿25,000/yr" },
  { name: "sm  · 14px", cls: "text-sm",  sample: "axis label · caption · เบี้ยประกัน" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ── */}
      <header className="border-b border-border px-8 py-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-display text-5xl font-black tracking-tight" style={{ color: "var(--gold-500)" }}>
              Lakoi Wealth
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Insurance & investment visualizer · Sprint 1 — Design System Showcase
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: "var(--teal-500)", color: "var(--teal-500)" }}>
              v0.1.0-sprint1
            </Badge>
            <Button
              size="sm"
              className="font-semibold"
              style={{ background: "var(--gold-500)", color: "var(--bg-base)" }}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Load Demo
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-8 py-12">

        {/* ── Navigation ── */}
        <section>
          <SectionTitle>Module Navigation</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card className="h-full cursor-pointer border-border transition-all duration-300 hover:border-[rgba(201,168,76,0.4)] hover:shadow-[0_0_24px_rgba(201,168,76,0.15)] active:scale-[0.97]"
                  style={{ background: "var(--bg-surface)" }}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="h-5 w-5 shrink-0" style={{ color: "var(--gold-500)" }} />
                    <span className="text-sm font-medium">{label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Color Palette ── */}
        <section>
          <SectionTitle>Color Palette</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map(({ hex, label, sub }) => (
              <div key={hex} className="space-y-2">
                <div
                  className="h-16 w-full rounded-lg border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  style={{ backgroundColor: hex }}
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Typography ── */}
        <section>
          <SectionTitle>Typography Scale</SectionTitle>
          <Tabs defaultValue="display">
            <TabsList className="mb-6" style={{ background: "var(--bg-elevated)" }}>
              <TabsTrigger value="display">Display — Playfair Display</TabsTrigger>
              <TabsTrigger value="body">Body — DM Sans</TabsTrigger>
            </TabsList>
            <TabsContent value="display" className="space-y-5">
              {typeSizes.map(({ name, cls, sample }) => (
                <div key={name} className="flex items-baseline gap-6">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground font-mono">{name}</span>
                  <span className={`text-display font-bold leading-tight ${cls}`} style={{ color: "var(--gold-500)" }}>
                    {sample}
                  </span>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="body" className="space-y-5">
              {typeSizes.map(({ name, cls, sample }) => (
                <div key={name} className="flex items-baseline gap-6">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground font-mono">{name}</span>
                  <span className={`leading-tight ${cls}`}>{sample}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* ── Components ── */}
        <section>
          <SectionTitle>UI Components</SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2">

            <Card style={{ background: "var(--bg-surface)" }} className="border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Buttons</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button style={{ background: "var(--gold-500)", color: "var(--bg-base)" }} className="font-semibold">
                  Primary
                </Button>
                <Button variant="outline" style={{ borderColor: "rgba(201,168,76,0.4)", color: "var(--gold-500)" }}>
                  Outline
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>

            <Card style={{ background: "var(--bg-surface)" }} className="border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Inputs & Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Premium per year</Label>
                  <Input placeholder="฿80,000" style={{ background: "var(--bg-elevated)" }} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Return: 6%</Label>
                  <Slider defaultValue={[6]} min={1} max={15} step={0.5} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Presentation Mode</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: "var(--bg-surface)" }} className="border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Gradients</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="h-12 rounded-lg shadow-[0_0_24px_rgba(201,168,76,0.3)]"
                  style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)" }} />
                <div className="h-12 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #2dd4bf, #34d399)" }} />
                <div className="h-12 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #fb7185, #f43f5e)" }} />
              </CardContent>
            </Card>

            <Card style={{ background: "var(--bg-surface)" }} className="border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Badges & Tags</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" style={{ borderColor: "var(--teal-500)", color: "var(--teal-500)" }}>Income</Badge>
                  <Badge variant="outline" style={{ borderColor: "var(--rose-500)", color: "var(--rose-500)" }}>Expense</Badge>
                  <Badge variant="outline" style={{ borderColor: "var(--blue-500)", color: "var(--blue-500)" }}>Investment</Badge>
                  <Badge variant="outline" style={{ borderColor: "var(--gold-500)", color: "var(--gold-500)" }}>Premium</Badge>
                  <Badge variant="outline" style={{ borderColor: "var(--purple-500)", color: "var(--purple-500)" }}>Goal</Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[8, 12, 16, 24].map((r) => (
                    <div key={r} className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 border" style={{ borderRadius: r, borderColor: "var(--gold-500)", background: "rgba(201,168,76,0.1)" }} />
                      <span className="text-xs text-muted-foreground">{r}px</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-full border" style={{ borderColor: "var(--gold-500)", background: "rgba(201,168,76,0.1)" }} />
                    <span className="text-xs text-muted-foreground">full</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

        <Separator />

        {/* ── Motion Tokens ── */}
        <section>
          <SectionTitle>Motion Tokens</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "fast",   ms: "150ms", use: "button press, hover" },
              { name: "base",   ms: "300ms", use: "UI transitions" },
              { name: "medium", ms: "600ms", use: "chart redraws" },
              { name: "slow",   ms: "900ms", use: "entrance animations" },
            ].map(({ name, ms, use }) => (
              <Card key={name} style={{ background: "var(--bg-surface)" }} className="border-border p-4 text-center">
                <p className="font-mono text-2xl font-bold" style={{ color: "var(--gold-500)" }}>{ms}</p>
                <p className="mt-1 text-xs font-medium">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{use}</p>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Sprint Checklist ── */}
        <section>
          <SectionTitle>Sprint 1 Checklist</SectionTitle>
          <div className="space-y-2.5">
            {[
              { done: true,  label: "Next.js 15.5 · React 19 · TypeScript strict" },
              { done: true,  label: "Tailwind CSS 4 — CSS-based @theme config" },
              { done: true,  label: "All PRD §5 design tokens wired (colors, type, radius, motion, shadows)" },
              { done: true,  label: "Google Fonts: Playfair Display (700/900) + DM Sans (400–700)" },
              { done: true,  label: "shadcn/ui: button, card, badge, input, label, select, slider, tabs, dialog, sheet, switch, separator" },
              { done: true,  label: "Folder structure per PRD §6: app/(app)/*, components/*, lib/*, types/*" },
              { done: true,  label: "TypeScript types: all data models (InsurancePolicy, Goal, AppState, …)" },
              { done: true,  label: "Zustand UI store at lib/store/ui.ts" },
              { done: true,  label: "Demo data seed at lib/data/demo-data.ts (realistic Thai agent scenario)" },
              { done: true,  label: "Currency utils: formatBaht(), formatPercent()" },
              { done: true,  label: "iPad viewport: device-width, no zoom, viewportFit=cover, safe area insets" },
              { done: true,  label: "Touch optimization: 44px min targets, tap highlight off, manipulation" },
              { done: false, label: "Git init + first commit" },
              { done: false, label: "Vercel deployment" },
            ].map(({ done, label }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-base" style={{ color: done ? "var(--teal-500)" : "var(--text-muted)" }}>
                  {done ? "✓" : "○"}
                </span>
                <span style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer disclaimer ── */}
      <footer className="border-t border-border px-8 py-6 mt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-center text-muted-foreground">
            ตัวเลขทั้งหมดเป็นการคาดการณ์โดยอิงข้อมูลที่ผู้ใช้กรอก
            มิใช่คำแนะนำการลงทุนหรือการประกัน
            ผลตอบแทนในอนาคตอาจแตกต่างจากการคาดการณ์
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-lg font-semibold text-foreground">{children}</h2>
  );
}
