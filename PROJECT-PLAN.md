# Lakoi Wealth — Project Plan

**Phase:** 0 (Build & Validate)  
**Stack:** Next.js 15 · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · Zustand · Vercel

---

## Admin Portfolio Dashboard ✅
*Personal growth portfolio monitor for Max — separate from the client-facing app.*

- [x] PIN-gated `/admin/*` route group (`ADMIN_PIN` env var, localStorage persistence)
- [x] Yahoo Finance proxy `/api/price/[ticker]` (server-side, avoids CORS, 5-min cache)
- [x] USDTHB live rate auto-fetched on every page load (`USDTHB=X`)
- [x] All currency in Thai Baht (฿) — input, display, rebalancer
- [x] Portfolio table: price ฿, 24h%, value ฿, actual/target weights, drift, signal badge
- [x] Summary cards: total ฿, biggest drift, bucket breakdown
- [x] Rebalancing calculator: new cash (฿) → per-asset buy amounts (฿), skips AVOID assets
- [x] Technical signal engine — weighted scoring:
  - RSI(14), EMA 20/50 cross, vs EMA200, 52w high distance
  - Crypto (`*-USD`) uses wider thresholds (30/15/10% vs 20/10/5%)
  - Income ETFs (SGOV, BIL, SHV…) → hardcoded HOLD — Income Asset
  - Score ≥ 3 = BUY · 0–2 = HOLD · < 0 = AVOID
- [x] Signal panel: tap to expand per-indicator point breakdown
- [x] DCA log: collapsible per asset, entries in ฿, auto-computes units
- [x] Settings: card-per-asset layout, Value ฿ input, export/import JSON
- [x] Default 9-asset portfolio pre-loaded (BTC, SPY, GOOG, NVDA, GLD, SGOV, TSLA, LLY, SOFI)
- [x] All state persisted in localStorage (`lakoi-growth-portfolio`)

**To deploy on Vercel:** set `ADMIN_PIN` environment variable.

---

## Sprint 1 — Foundation ✅

- [x] Next.js 15 App Router + TypeScript strict mode
- [x] Tailwind CSS 4 design tokens (gold, teal, rose, blue, slate palette)
- [x] shadcn/ui base components (Button, Input, Label, Separator, ScrollArea)
- [x] Folder structure per PRD §6
- [x] Vercel deployment pipeline (auto-deploy on push)
- [x] Design system showcase home page

---

## Sprint 2 — Insurance Module 🔄

- [x] Data layer: TypeScript types (EndowmentPolicy, HealthPolicy, UnitLinkPolicy, AccidentPolicy, TermRider)
- [x] Calculations: `endowment.ts`, `health-premium.ts`, `unit-link.ts`
- [x] Demo data: DEMO_ENDOWMENT, DEMO_HEALTH, DEMO_UL
- [x] Zustand insurance store with localStorage persistence
- [x] CurrencyInput component (Thai locale formatting, ฿ prefix)
- [x] Endowment page — input panel + ComposedChart (premium/maturity/death benefit)
- [x] Slider track styling (gold fill, WebKit/Moz pseudo-elements, touch-optimized)
- [x] Death benefit (ทุนประกัน) vs maturity value (มูลค่าเวนคืน) correctly separated
- [x] S-curve default cash values (realistic endowment shape)
- [x] PremiumGrid component (Smart/Detailed mode, linear interpolation, promote-to-explicit)
- [ ] Health insurance page ← current
- [ ] Unit Link page

---

## Sprint 3 — Use Case 1: Endowment-to-Health Bridge

Endowment matures at age 55 → cash funds health premiums until age 70.
Show the "bridge" visually: endowment maturity cash flow covering health costs.

---

## Sprint 4 — Use Case 2: UL Lifetime Value

Unit Link with premiums, top-ups, and monthly withdrawals from age 60.
Show projection to age 90, highlight peak value and withdrawal sustainability.

---

## Sprint 5 — Balance Sheet + Cashflow Timeline

- Personal balance sheet (assets/liabilities pie + net worth KPI)
- Cashflow timeline (monthly/yearly, all flows integrated)

---

## Sprint 6 — Investment Portfolio + Goals + Use Case 3

- Fund/stock portfolio with DCA
- Goal planning (retirement, education, down payment)
- Use Case 3: Portfolio Growth vs Goals gap analysis

---

## Sprint 7 — Supporting Modules

- Tax optimizer (Thai: RMF/LTF/insurance deductions)
- Debt optimizer (avalanche/snowball comparison)
- Emergency fund runway
- Stress test (what if income drops X%)

---

## Sprint 8 — Scenario Comparison + Export

- Save scenario A, modify → save scenario B, side-by-side comparison
- PDF export (@react-pdf/renderer)
- PNG export (chart screenshot)

---

## Sprint 9 — Polish + PWA

- next-pwa offline support + install prompt
- Presentation mode (client-facing: larger fonts, hide input panels)
- Framer Motion page transitions + number count-up animations
- iPad landscape optimization pass

---

## Sprint 10 — Validation with Thai Insurance Agents

- Field testing with 3-5 real agents
- Collect feedback, prioritize fixes
- Final Vercel production deploy
