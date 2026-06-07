# Lakoi Wealth — Claude Code Context

## What this project is

**Lakoi Wealth** has two distinct products in one repo:

1. **Client-facing planning app** (`/demo` → all other routes) — iPad-first cooperative web app for Thai insurance agents to visualize financial planning with clients in real-time. Thai language UI.

2. **Admin portfolio dashboard** (`/admin/portfolio`) — Personal growth portfolio monitor for Max (the owner). PIN-gated, English UI, live market data.

---

## Tech Stack (non-negotiable)

- Next.js 15 App Router + TypeScript strict mode
- Tailwind CSS 4 with CSS custom properties (`var(--gold-500)`, `var(--bg-surface)`, etc.)
- shadcn/ui base components
- Recharts for charts
- Framer Motion for animations
- Zustand + `persist` middleware for all state (localStorage)
- `@react-pdf/renderer` for PDF export
- `@vercel/blob` for cloud sync of admin portfolio data
- Primary data store: localStorage. Cloud backup: Vercel Blob (admin portfolio only).

---

## Folder Structure

```
app/
  (app)/                    # Route group — shares AppLayout (transitions, disclaimer)
    demo/                   # Nav hub — load demo profiles, access all modules
    admin/                  # PIN-gated admin section (AdminGate layout)
      portfolio/            # Growth portfolio dashboard
    balance-sheet/
    cashflow/
    portfolio/              # Thai financial planning portfolio (legacy name)
    insurance/endowment|health|unit-link/
    goals/  scenarios/  profile/
    use-cases/bridge|portfolio-projection|ul-lifetime/
  api/
    admin/verify/           # POST — verify ADMIN_PIN env var
    price/[ticker]/         # GET — Yahoo Finance proxy (returns price + 252d OHLCV)
    portfolio/sync/         # GET/POST — Vercel Blob cloud sync for admin portfolio
  globals.css               # Design tokens, Tailwind theme overrides
  layout.tsx                # Root layout (fonts, metadata)
  page.tsx                  # Landing page

components/
  admin/AdminGate.tsx       # PIN dialog + localStorage auth check
  growth-portfolio/         # All admin dashboard components
    SummaryCards.tsx        # Total ฿ value, drift alert, bucket breakdown
    PortfolioTable.tsx      # Per-asset: price ฿, 24h%, value ฿, weights, drift, signal
    RebalancerPanel.tsx     # New cash (฿) → per-asset buy suggestions (฿)
    SignalPanel.tsx         # Technical signals — expandable per-indicator breakdown
    DCALog.tsx              # Collapsible DCA history per asset, add entries in ฿
    SettingsPanel.tsx       # Card-per-asset: name, target%, value ฿, bucket; export/import
  ui/                       # shadcn/ui primitives

lib/
  store/
    growthPortfolio.ts      # Admin portfolio Zustand store (persist: "lakoi-growth-portfolio")
    balanceSheet.ts         # Client app store (persist: "lakoi-balance-sheet")
    insurance.ts  goals.ts  scenarios.ts  ui.ts
  calculations/
    indicators.ts           # RSI(14), EMA(n), 52w-high, computeAssetSignal — pure functions
    portfolio.ts  cashflow.ts  endowment.ts  health-premium.ts  unit-link.ts  ...

types/
  growthPortfolio.ts        # PortfolioAsset, DCAEntry, PriceData, AssetSignal, IndicatorBreakdown
  index.ts                  # All other shared types
  insurance.ts
```

---

## Admin Portfolio Dashboard — key details

**Route:** `/admin/portfolio`  
**Auth:** PIN via `/api/admin/verify` (reads `process.env.ADMIN_PIN`). On success, sets `localStorage["lakoi-admin-authed"] = "1"` (persists across restarts).  
**Env vars needed:** `ADMIN_PIN` and `BLOB_READ_WRITE_TOKEN` in `.env.local` and Vercel env vars.  
Pull both locally with: `vercel env pull .env.local`

### Cloud sync (`/api/portfolio/sync`)
Portfolio state is synced to Vercel Blob at `portfolio/lakoi-growth-portfolio.json`.  
- **On page load**: fetches blob → imports into Zustand store (cloud wins over localStorage)  
- **On any change**: debounced 2s POST saves current state to blob  
- **Bootstrap**: if blob is empty on first load, local state is pushed up automatically  

**Blob store is private.** Key patterns for working with it:
```ts
import { list, put } from "@vercel/blob";

// Write
await put("path/file.json", JSON.stringify(data), {
  access: "private",          // store is private — never use "public"
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
});

// Read — must pass Authorization header; downloadUrl also requires it
const { blobs } = await list({ prefix: "path/file.json" });
const res = await fetch(blobs[0].url, {
  cache: "no-store",
  headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
});
const data = await res.json();
```

### Currency
Everything is Thai Baht (฿). USD prices from Yahoo Finance are multiplied by the live USDTHB rate.  
`USDTHB=X` is fetched from Yahoo Finance on every page load and stored in the Zustand store.  
Users can override the rate in Settings if needed.

### Price data
`GET /api/price/[ticker]` proxies Yahoo Finance (avoids browser CORS):
```
https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1y
```
Returns: `{ price, prevClose, closes: number[], highs: number[], updatedAt, stale }`.  
Server-side cache: 5 minutes (`next: { revalidate: 300 }`).

### Asset values
- **DCA path**: `units_held × live_price_usd × usdthbRate` (units accumulated from DCA log)
- **Manual path**: `manualValueTHB` directly (set in Settings → Value ฿)

### Signal engine (`lib/calculations/indicators.ts`)

**Income assets** (SGOV, BIL, SHV, TLT, IEF, AGG, BND, GOVT…): skip all math → `HOLD — Income Asset`.

**Crypto** (`*-USD` tickers): use wider 52w-high thresholds (markets are more volatile).

**Weighted scoring:**

| Indicator | Condition | Points |
|---|---|---|
| RSI(14) | < 30 oversold | +2 |
| RSI(14) | 30–50 | +1 |
| RSI(14) | 50–70 | 0 |
| RSI(14) | > 70 overbought | -2 |
| EMA 20/50 | EMA20 > EMA50 | +1 |
| EMA 20/50 | EMA20 < EMA50 | -1 |
| vs EMA200 | price above | +1 |
| vs EMA200 | price below | -1 |
| 52w High (equity) | >20% below | +2 |
| 52w High (equity) | 10–20% below | +1 |
| 52w High (equity) | within 5% | -2 |
| 52w High (crypto) | >30% below | +2 |
| 52w High (crypto) | 15–30% below | +1 |
| 52w High (crypto) | within 10% | -2 |

**Composite:** score ≥ 3 → BUY · 0–2 → HOLD · < 0 → AVOID

### Rebalancer logic
```
target_value[i] = (total_value + new_cash) × target_weight[i]
buy_amount[i]   = max(0, target_value[i] - current_value[i])
// Skip assets where composite signal = AVOID
// Normalize buy_amounts so sum = new_cash
```

### Default portfolio (pre-loaded on first visit)
BTC-USD 30% Core · SPY 20% Core · GOOG 15% Growth · NVDA 10% Growth · GLD 5% Hedge · SGOV 5% Hedge · TSLA 5% Speculative · LLY 5% Speculative · SOFI 5% Speculative

---

## Client App — key details

Thai language UI. iPad landscape primary. All client-facing text in Thai.

**Demo entry point:** `/demo` — load a demo profile, then navigate to any module.

**Key modules:** Balance sheet · Cashflow · Portfolio projection · Insurance (Endowment / Health / Unit Link) · Goals · Scenarios · Bridge use-case · UL Lifetime use-case

**Design tokens (never hardcode hex — use these):**
```
--gold-500:   #c9a84c   (primary, KPIs)
--teal-500:   #2dd4bf   (positive, income, growth)
--rose-500:   #fb7185   (negative, expense, debt)
--blue-500:   #60a5fa   (investments, data)
--purple-500: #a78bfa   (hedge bucket)
--bg-base     --bg-surface    --bg-elevated
--border      --foreground    --muted-foreground
```

---

## Code Rules

- **Separate logic from UI.** Calculations in `lib/calculations/*.ts` as pure functions.
- **Components are dumb.** Receive props and render. State in Zustand stores.
- **No `any` type.** Use `unknown` or proper types.
- **No global state in `useState`.** Use Zustand.
- **No calculations inside components.** Extract to `lib/calculations/`.
- **Components < 200 lines.** Split if larger.
- **No `console.log` in committed code.**
- **No comments** unless the WHY is non-obvious.

---

## Workflow

1. Check this file + `PROJECT-PLAN.md` to understand current state before starting.
2. Plan before coding — state what files you'll create/modify and the data flow.
3. Build incrementally. Test in browser before marking done.
4. Update `PROJECT-PLAN.md` when a feature is complete.
5. Commit: `git add [specific files] && git commit -m "feat: ..."` — never add `.env*`.
