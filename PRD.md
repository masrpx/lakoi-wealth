# Lakoi Wealth — Product Requirements Document
**Version:** 1.0 · **Date:** May 2026 · **Status:** Phase 0 — Build & Validate

---

## 1. PRODUCT VISION

### What it is
A **cooperative iPad-first web app** that insurance agents open *next to* their clients during sales conversations. It visualizes how insurance premiums, cash returns, and investments interact across the client's lifetime — turning abstract numbers into a living, interactive picture.

### What it is NOT
- ❌ A CRM (no client database, no contact management)
- ❌ A backend system (no accounts, no auth, no sync — Phase 0)
- ❌ A replacement for insurance company illustrations (it complements them)
- ❌ A general-purpose financial planning tool (laser-focused on insurance bridge cases)

### Core Promise
> "Show clients exactly what they'll pay, when they'll receive money back, and how every insurance/investment decision changes their financial picture from age 35 to 90 — in real time, while sitting next to them."

### Primary Users
- **Primary:** Insurance agents (life/health/UL) — Thailand
- **Secondary:** Financial advisors, IFAs, CFP holders
- **Tertiary:** End clients (consume only — they don't input)

### Use Mode
**Cooperative:** Agent and client both look at the same iPad. Agent inputs, both watch the visualization update. Designed for face-to-face sales conversations.

---

## 2. THE 3 KILLER USE CASES

### UC-1: Endowment-to-Health Bridge
"Client buys an endowment plan now → maturity at age 55 → uses that lump sum to fund health insurance premiums until age 70."

**Visualization:** Cashflow timeline showing premium outflow (red) age 35-55, lump sum inflow at 55 (green spike), then health premium outflow ages 55-70 (depleting the lump sum). User sees if the lump sum is enough.

### UC-2: Unit Link Lifetime Value
"Client buys UL with X premium + Y sum insured → at age 60, starts withdrawing Z baht/month → policy value over time."

**Visualization:** Dual-axis chart showing (1) cumulative premiums paid, (2) policy value growing with returns, (3) withdrawal phase depleting it. Top-up scenarios overlaid.

### UC-3: Portfolio Growth vs Goals
"Client invests in funds/stocks with expected return X% + DCA Y baht/month → reaches goal at age Z?"

**Visualization:** Wealth curve over time, with goal markers (retirement, education, etc.). Shows if current plan reaches the goal or falls short.

---

## 3. FEATURE INVENTORY

### 3.1 Core Modules (Must-Have for Phase 0)

#### **M1: Personal Balance Sheet** *(simple — already prototyped)*
- Input: Assets (cash, property, investments, gold, other)
- Input: Liabilities (debts with monthly payment)
- Output: Total assets, total liabilities, net worth
- Visualization: Pie chart + table

#### **M2: Cashflow Timeline**
- Toggle: Monthly view / Yearly view
- Inputs flow in from:
  - Manual income/expense
  - All insurance premiums (M3)
  - All policy cash returns (from M3 maturity)
  - Investment contributions (M5)
  - Investment withdrawals (from goals/retirement)
- Visualization: Stacked bar chart showing in/out per period
- Key innovation: shows premium burden + return inflows on the SAME timeline

#### **M3: Insurance Portfolio** *(THE KILLER MODULE)*

**Three insurance types — different input schemas:**

##### **3a. Endowment / Whole Life / Term**
- Premium per year (fixed)
- Years of payment
- Coverage period (years)
- Sum insured
- **Cash value table:** Year-by-year expected return at maturity
- Calculates: Total paid, expected return, IRR

##### **3b. Health Insurance** *(year-by-year input — Option B confirmed)*
- Coverage period (start age → end age, e.g., 35-99)
- **Premium grid:** Year-by-year input
  - UI: Excel-like grid showing age 35 → 99
  - Smart defaults: Premium auto-fills based on age bands typed (35-40: ฿25k, 41-45: ฿32k, etc.)
  - Override: Tap any year to manually adjust
- Sum insured
- Visualization: Premium curve over time (rising shape)

##### **3c. Unit Link** *(complex — needs special care)*
- Regular premium per year
- Sum insured
- **Top-up tracking:**
  - Initial top-up (lump sum at start)
  - Recurring top-up (additional amount per year)
  - Ad-hoc top-ups (specific year + amount, e.g., "year 5: ฿100,000")
- Expected return % per year (configurable)
- Cost of Insurance (COI) — simplified flat % or age-based table
- Calculates: Policy value year-by-year = (premium + top-ups) × (1 + return) − COI
- **Withdrawal scenarios:**
  - Start age for withdrawal
  - Monthly/yearly withdrawal amount
- Visualization: Policy value curve, showing top-up bumps + withdrawal depletion

#### **M4: Investment Portfolio**
- Add fund/stock items: name, category, current value, expected annual return
- DCA settings: amount per month, start year, end year
- Visualization: Pie chart (allocation) + growth projection chart
- Weighted average expected return

#### **M5: Goal Planning** *(3 preset types)*
- Retirement (target age + monthly expense post-retirement, inflation-adjusted)
- Children's Education (target year, target amount, e.g., ฿2M at year 18)
- Down payment (target year, target amount)
- Output: Required monthly savings to reach each goal

#### **M6: Scenario Comparison**
- Save current state as "Scenario A"
- Modify inputs → save as "Scenario B"
- Toggle/compare side-by-side
- Up to 3 scenarios at once

### 3.2 Use Case Pages (Built on top of modules)

- **UC-1 Bridge Visualizer:** Special view combining Endowment maturity → Health premium funding
- **UC-2 UL Lifetime:** Special view with prominent top-up controls + withdrawal slider
- **UC-3 Portfolio Projection:** Combined view of investments + goals

### 3.3 Supporting Modules

- **Insurance Gap Analysis:** Shows life coverage vs (debts + family expenses × years)
- **Emergency Fund Runway:** Months you can survive on cash + liquid assets
- **Tax Optimizer:** Thailand-specific (LTF/RMF/SSF + life/health premium deductions)
- **Stress Test:** 3 preset scenarios (market crash 30%, inflation spike to 5%, income loss 6 months)
- **Debt Optimizer:** Avalanche vs Snowball, prepayment ROI

### 3.4 Export & Sharing

- **Export to PDF:** Single-page summary with all charts (for sending to client via LINE)
- **Export to Image:** Individual charts as PNG for quick sharing
- **Save Session:** Save current input state as JSON to device (rehydrate later)
- **Demo Mode:** Pre-loaded realistic demo data — instant visualization on first open

---

## 4. UX PRINCIPLES (Cooperative iPad-First)

### Design Tenets

1. **Visual-first** — Charts dominate, numbers are secondary
2. **Big touch targets** — Minimum 44pt tap targets (Apple HIG)
3. **No keyboard if avoidable** — Sliders, steppers, picker wheels > number input
4. **Two-distance readable** — Text/charts must be readable from 1 meter
5. **Smooth animation** — All number/chart changes animate (300-800ms ease-out)
6. **One screen, one purpose** — Don't overload; use tabs/swipe
7. **Instant feedback** — Every input change reflects in chart < 100ms
8. **Reversible** — Undo last action always available

### Presentation Mode (Special)
A toggle that switches to "client-facing" view:
- Hide technical labels (replace with friendly Thai)
- Larger fonts
- Hide input forms — show only charts
- Auto-walk through key insights (story mode)

### Information Hierarchy

```
TIER 1 (always visible, prominent):
  - Current chart/visualization
  - Key insight (e.g., "Age 55: receive ฿1.2M")
  - Primary action

TIER 2 (one tap away):
  - Input forms
  - Secondary details
  - Drill-down breakdowns

TIER 3 (settings, rarely accessed):
  - Demo data reset
  - Export options
  - Help/about
```

---

## 5. DESIGN SYSTEM

### Brand Identity
- **Name:** Lakoi Wealth *(logo to be added later)*
- **Personality:** Sophisticated, trustworthy, calm, premium
- **Anti-personality:** NOT corporate-cold, NOT young/playful, NOT busy/cluttered

### Color Palette

```
PRIMARY (gold/premium):
  --gold-500: #c9a84c   /* primary actions, accents */
  --gold-300: #f0d080   /* hover, lighter accents */
  --gold-700: #8b7530   /* pressed states */

SEMANTIC (data viz):
  --teal-500: #2dd4bf   /* positive: income, growth, returns */
  --rose-500: #fb7185   /* negative: expense, premium, debt */
  --blue-500: #60a5fa   /* neutral data: investments */
  --purple-500: #a78bfa /* tertiary data */

NEUTRALS:
  --bg-base: #0a0e1a    /* main background — deep navy */
  --bg-surface: #111827 /* card background */
  --bg-elevated: #1a2236 /* nested surfaces, inputs */
  --border: rgba(255,255,255,0.07)
  --text-primary: #f1f5f9
  --text-secondary: #94a3b8
  --text-muted: #6b7280

CHART GRADIENTS:
  --grad-gold: linear-gradient(135deg, #c9a84c, #f0d080)
  --grad-teal: linear-gradient(135deg, #2dd4bf, #34d399)
  --grad-rose: linear-gradient(135deg, #fb7185, #f43f5e)
```

### Typography

```
DISPLAY (for big numbers, kpi values):
  font-family: 'Playfair Display', 'IBM Plex Serif Thai', serif
  weights: 700, 900

BODY (UI, labels):
  font-family: 'DM Sans', 'IBM Plex Sans Thai', sans-serif
  weights: 400, 500, 600, 700

SIZES (iPad-optimized):
  --text-xs: 12px   (captions, axis labels)
  --text-sm: 14px   (body, inputs)
  --text-base: 16px (default)
  --text-lg: 18px   (section titles)
  --text-xl: 22px   (page titles)
  --text-2xl: 28px  (KPI values)
  --text-3xl: 36px  (hero numbers)
  --text-4xl: 48px  (presentation mode hero)
```

### Spacing & Radius

```
SPACING (4pt grid):
  --space-1: 4px
  --space-2: 8px
  --space-3: 12px
  --space-4: 16px
  --space-6: 24px
  --space-8: 32px
  --space-12: 48px

RADIUS:
  --radius-sm: 8px   (small elements: badges, chips)
  --radius-md: 12px  (inputs, buttons)
  --radius-lg: 16px  (cards)
  --radius-xl: 24px  (modals, sheets)
  --radius-full: 9999px (pills)

SHADOWS:
  --shadow-card: 0 8px 32px rgba(0,0,0,0.4)
  --shadow-elevated: 0 16px 48px rgba(0,0,0,0.5)
  --shadow-glow-gold: 0 0 24px rgba(201,168,76,0.3)
```

### Motion

```
DURATIONS:
  --duration-fast: 150ms     (button press, hover)
  --duration-base: 300ms     (most UI transitions)
  --duration-medium: 600ms   (chart redraws, page transitions)
  --duration-slow: 900ms     (entrance animations, story mode)

EASINGS:
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1)         /* default */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* bouncy */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)     /* smooth */

CHART ANIMATIONS:
  - Bar charts: bars rise from baseline, staggered 30ms
  - Line charts: line draws left-to-right, 800ms
  - Pie charts: arcs sweep from 12 o'clock, 600ms
  - Number changes: count-up animation 400ms
```

---

## 6. TECH ARCHITECTURE

### Stack (confirmed)

```
Framework:        Next.js 15 (App Router)
Language:         TypeScript (strict mode)
Styling:          Tailwind CSS 4 + CSS variables for tokens
UI Components:    shadcn/ui (base components)
Charts:           Recharts (primary) + custom SVG for special cases
Animation:        Framer Motion
State:            Zustand (light, no Redux)
Storage:          LocalStorage + IndexedDB (via Dexie.js)
PWA:              next-pwa
PDF Export:       @react-pdf/renderer
Icons:            Lucide React
Hosting:          Vercel (free tier)
Domain:           lakoi.wealth or wealth.lakoi.app (TBD)
```

### Project Structure

```
lakoi-wealth/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (theme, fonts)
│   ├── page.tsx                  # Landing/home
│   ├── (app)/                    # App routes
│   │   ├── balance-sheet/
│   │   ├── cashflow/
│   │   ├── insurance/
│   │   │   ├── endowment/
│   │   │   ├── health/
│   │   │   └── unit-link/
│   │   ├── portfolio/
│   │   ├── goals/
│   │   ├── scenarios/
│   │   └── use-cases/
│   │       ├── bridge/
│   │       ├── ul-lifetime/
│   │       └── portfolio-projection/
│   └── api/                      # (Phase 0: empty, no backend)
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── charts/                   # Reusable chart components
│   │   ├── CashflowChart.tsx
│   │   ├── WealthCurve.tsx
│   │   ├── PolicyValueChart.tsx
│   │   ├── BridgeFlowChart.tsx
│   │   └── ...
│   ├── inputs/                   # Specialized input components
│   │   ├── CurrencyInput.tsx
│   │   ├── AgeRangeSlider.tsx
│   │   ├── PremiumGrid.tsx       # Year-by-year health premium
│   │   ├── TopUpEditor.tsx       # UL top-up management
│   │   └── ...
│   ├── presentation/             # Presentation mode components
│   └── layout/                   # Nav, headers, etc.
│
├── lib/
│   ├── calculations/             # Pure calculation functions
│   │   ├── endowment.ts
│   │   ├── unit-link.ts
│   │   ├── health-premium.ts
│   │   ├── portfolio.ts
│   │   ├── retirement.ts
│   │   └── tax-thai.ts
│   ├── store/                    # Zustand stores
│   │   ├── balanceSheet.ts
│   │   ├── insurance.ts
│   │   ├── portfolio.ts
│   │   ├── scenarios.ts
│   │   └── ui.ts
│   ├── data/
│   │   ├── demo-data.ts          # Preloaded demo for instant viz
│   │   └── thai-tax-brackets.ts
│   └── utils/
│       ├── currency.ts            # ฿1,234,567 / 1.2M formatting
│       ├── date.ts
│       └── export.ts
│
├── types/                        # TypeScript types
├── styles/                       # Global styles
├── public/                       # Static assets
├── tailwind.config.ts            # Design tokens
└── PROJECT-PLAN.md               # Living roadmap (Max + Claude Code)
```

### Data Models (TypeScript Types)

```typescript
// === Insurance ===
interface InsurancePolicy {
  id: string
  type: 'endowment' | 'whole_life' | 'term' | 'health' | 'unit_link' | 'accident'
  name: string
  startAge: number
  // Discriminated union below by type
}

interface EndowmentPolicy extends InsurancePolicy {
  type: 'endowment' | 'whole_life' | 'term'
  yearlyPremium: number
  paymentPeriodYears: number
  coveragePeriodYears: number
  sumInsured: number
  cashValueByYear: number[] // index 0 = year 1
}

interface HealthPolicy extends InsurancePolicy {
  type: 'health'
  endAge: number
  yearlyPremiumByAge: Record<number, number>  // { 35: 25000, 36: 27000, ... }
  sumInsured: number
}

interface UnitLinkPolicy extends InsurancePolicy {
  type: 'unit_link'
  regularYearlyPremium: number
  paymentPeriodYears: number
  sumInsured: number
  initialTopUp: number
  recurringTopUp: number  // per year
  adHocTopUps: { year: number, amount: number }[]
  expectedReturn: number  // % per year
  costOfInsurance: number // % of policy value
  withdrawals: {
    startAge: number
    monthlyAmount: number
  } | null
}

// === Portfolio ===
interface InvestmentItem {
  id: string
  name: string
  category: 'fund' | 'stock' | 'crypto' | 'bond' | 'reit' | 'other'
  currentValue: number
  expectedReturn: number  // % per year
  monthlyDCA?: number
}

// === Goals ===
interface Goal {
  id: string
  type: 'retirement' | 'education' | 'down_payment' | 'custom'
  name: string
  targetAge?: number
  targetYear?: number
  targetAmount: number
  monthlyAmountAfter?: number  // for retirement
  inflationRate?: number
}

// === Scenario ===
interface Scenario {
  id: string
  name: string
  createdAt: string
  state: AppState  // snapshot of everything
}
```

### Calculation Engine Principles

1. **Pure functions** — All calculations are pure (no side effects, deterministic)
2. **Single source of truth** — One canonical function per concept
3. **Composition over magic** — Big calcs = composition of small ones
4. **Testable** — Each function has clear input/output contract

Example:
```typescript
// lib/calculations/unit-link.ts
export function calculateUnitLinkValueByYear(policy: UnitLinkPolicy): {
  year: number
  age: number
  totalPaidPremium: number
  totalTopUp: number
  policyValue: number
  costOfInsuranceCharged: number
}[] {
  // Pure calculation, returns array per year
}
```

---

## 7. PHASE 0 SCOPE — Build Order (Killer Feature First)

### Sprint 1 (Week 1): Foundation
- Setup Next.js + TypeScript + Tailwind + shadcn/ui
- Design tokens implemented in tailwind.config.ts
- Layout shell + navigation
- Demo mode infrastructure
- Deploy to Vercel preview

### Sprint 2 (Week 2-3): Insurance Module — THE KILLER
- Insurance store (Zustand)
- 3a: Endowment input + cash value timeline visualization
- 3b: Health insurance with year-by-year premium grid
- 3c: Unit Link with top-up management + policy value chart
- Each insurance has its own "lifetime view" page

### Sprint 3 (Week 4): Use Case 1 — Bridge
- Combined visualization: Endowment maturity → Health premium funding
- Interactive: drag age slider, see flow change
- "Story mode" walkthrough

### Sprint 4 (Week 5): Use Case 2 — UL Lifetime
- Combined visualization: UL with top-ups + withdrawals
- Sensitivity sliders: change return %, see impact
- Withdrawal scenario planning

### Sprint 5 (Week 6): Balance Sheet + Cashflow
- Balance sheet inputs + visualization
- Cashflow with all premium/return flows integrated
- Toggle monthly/yearly view

### Sprint 6 (Week 7): Portfolio + Goals + UC-3
- Portfolio inputs + growth projection
- Goal planning (3 presets)
- Combined wealth curve

### Sprint 7 (Week 8): Supporting Modules
- Insurance Gap Analysis
- Emergency Fund Runway
- Tax Optimizer (Thai)
- Stress Test (3 presets)
- Debt Optimizer

### Sprint 8 (Week 9): Scenario Comparison + Export
- Scenario save/load/compare
- PDF export
- Image export

### Sprint 9 (Week 10): Polish + PWA
- Animations polish
- Presentation mode
- PWA installable
- Performance optimization

### Sprint 10 (Week 11-12): Validation
- Test with own clients
- Test with 5 external agents
- Iterate based on feedback

---

## 8. SUCCESS METRICS (Phase 0 Decision Gate)

**Go/No-Go criteria at end of Phase 0:**

### Quantitative
- [ ] 20+ external agents tried the app
- [ ] ≥ 60% used it more than once after first try
- [ ] ≥ 5 agents proactively shared with colleagues
- [ ] ≥ 10 agents said "yes" to ฿299/month pricing question

### Qualitative
- [ ] Agents report it "helps them close deals" or "looks more professional"
- [ ] Clients (end users) report "now I understand my insurance"
- [ ] At least 3 distinct use cases emerge that we didn't predict

**If 3+ quantitative + 2+ qualitative criteria met → proceed to Phase 1 (monetization)**

---

## 9. NON-GOALS FOR PHASE 0

To stay focused, explicitly NOT building:
- ❌ User accounts / authentication
- ❌ Cloud database / sync
- ❌ Multi-device sync
- ❌ Real-time collaboration
- ❌ Agent dashboard / management
- ❌ Commission tracking
- ❌ Client CRM features
- ❌ Stripe / payment integration
- ❌ Email notifications
- ❌ Mobile native app (iPad PWA is sufficient)
- ❌ Localization (Thai-first, English secondary; no other languages)
- ❌ White-label / theming
- ❌ Insurance product database (agents type their own numbers)
- ❌ Compliance reporting
- ❌ Audit trail

---

## 10. CONSTRAINTS & ASSUMPTIONS

### Constraints
- Solo developer (Max, learning Next.js as he goes)
- Side-project hours (~10-15 hrs/week available)
- Budget: < ฿50,000 for Phase 0 (mostly $0 — hosting free)
- Timeline: 10-12 weeks to validated MVP

### Assumptions
- Agents have iPads (~80% of professional agents in Thailand)
- Agents type insurance illustration numbers manually (no integration with insurance company systems)
- Internet available during sales conversations (or PWA works offline)
- English UI acceptable for technical labels; Thai for client-facing text

### Risks
- **Regulatory:** คปภ. may scrutinize tools used in insurance sales — add prominent disclaimer
- **Accuracy:** Calculations must match insurance company illustrations exactly → extensive testing
- **Adoption:** Agents are slow to adopt new tools → must be 10x easier than Excel to win
- **Competition:** Insurance companies may build internal versions → speed matters

---

## 11. LEGAL DISCLAIMERS (must appear in app)

```
"ตัวเลขทั้งหมดเป็นการคาดการณ์โดยอิงข้อมูลที่ผู้ใช้กรอก 
มิใช่คำแนะนำการลงทุนหรือการประกัน 
ผลตอบแทนในอนาคตอาจแตกต่างจากการคาดการณ์ 
โปรดปรึกษาผู้เชี่ยวชาญด้านการเงินก่อนตัดสินใจ"
```

Display: First-time onboarding modal + footer of every page + export documents.

---

## 12. APPENDIX: Key Calculations Reference

### Endowment Cash Value
```
Standard cash value follows insurance company illustration
User inputs year-by-year cash value table
No calculation by app — display only
```

### Unit Link Policy Value (simplified)
```
For each year Y:
  startValue = previousYearEndValue + yearlyPremium(Y) + topUps(Y)
  growth = startValue × expectedReturn
  coiCharge = startValue × costOfInsuranceRate
  endValue = startValue + growth - coiCharge - withdrawals(Y)
```

### Health Premium (Option B: year-by-year)
```
User inputs premium for each age
App allows "smart fill":
  - Type premium at age 35, 40, 45, 50, 55, 60, 65, 70
  - App linearly interpolates between
  - User can override any year
```

### Portfolio Growth
```
For each year Y:
  endValue = startValue × (1 + expectedReturn) + (12 × monthlyDCA)
```

### Retirement Need (4% Rule + Inflation)
```
yearsToRetirement = retireAge - currentAge
inflatedMonthlyNeed = currentMonthlyNeed × (1 + inflation)^yearsToRetirement
yearlyNeed = inflatedMonthlyNeed × 12
corpusNeeded = yearlyNeed / 0.04
```

### Insurance Gap (Life)
```
lifeCoverage = sum of all sumInsured (life-type policies)
familyNeed = (totalDebts) + (familyMonthlyExpense × 12 × yearsCoverage)
gap = familyNeed - lifeCoverage - currentLiquidAssets
```

---

## END OF PRD v1.0
