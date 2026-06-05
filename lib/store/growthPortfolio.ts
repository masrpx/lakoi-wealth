import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PortfolioAsset, DCAEntry, PriceData } from "@/types/growthPortfolio";

const DEFAULT_ASSETS: PortfolioAsset[] = [
  { id: "btc",  ticker: "BTC-USD", name: "Bitcoin",           targetWeight: 30, bucket: "Core",        manualValueTHB: 0, unitsHeld: 0 },
  { id: "spy",  ticker: "SPY",     name: "S&P 500 ETF",       targetWeight: 20, bucket: "Core",        manualValueTHB: 0, unitsHeld: 0 },
  { id: "goog", ticker: "GOOG",    name: "Alphabet",          targetWeight: 15, bucket: "Growth",      manualValueTHB: 0, unitsHeld: 0 },
  { id: "nvda", ticker: "NVDA",    name: "NVIDIA",            targetWeight: 10, bucket: "Growth",      manualValueTHB: 0, unitsHeld: 0 },
  { id: "gld",  ticker: "GLD",     name: "Gold ETF",          targetWeight: 5,  bucket: "Hedge",       manualValueTHB: 0, unitsHeld: 0 },
  { id: "sgov", ticker: "SGOV",    name: "T-Bills",           targetWeight: 5,  bucket: "Hedge",       manualValueTHB: 0, unitsHeld: 0 },
  { id: "tsla", ticker: "TSLA",    name: "Tesla",             targetWeight: 5,  bucket: "Speculative", manualValueTHB: 0, unitsHeld: 0 },
  { id: "lly",  ticker: "LLY",     name: "Eli Lilly",         targetWeight: 5,  bucket: "Speculative", manualValueTHB: 0, unitsHeld: 0 },
  { id: "sofi", ticker: "SOFI",    name: "SoFi Technologies", targetWeight: 5,  bucket: "Speculative", manualValueTHB: 0, unitsHeld: 0 },
];

interface GrowthPortfolioState {
  assets: PortfolioAsset[];
  dcaEntries: DCAEntry[];
  priceCache: Record<string, PriceData>;
  usdthbRate: number;

  addAsset(a: PortfolioAsset): void;
  updateAsset(id: string, u: Partial<PortfolioAsset>): void;
  removeAsset(id: string): void;

  addDCAEntry(e: DCAEntry): void;
  removeDCAEntry(id: string): void;

  setPrice(ticker: string, data: PriceData): void;
  markPricesStale(): void;

  setUsdthbRate(rate: number): void;

  exportJSON(): string;
  importJSON(json: string): void;
}

export const useGrowthPortfolioStore = create<GrowthPortfolioState>()(
  persist(
    (set, get) => ({
      assets: DEFAULT_ASSETS,
      dcaEntries: [],
      priceCache: {},
      usdthbRate: 35,

      addAsset: (a) => set((s) => ({ assets: [...s.assets, a] })),
      updateAsset: (id, u) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...u } : a)) })),
      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          dcaEntries: s.dcaEntries.filter((e) => e.assetId !== id),
        })),

      addDCAEntry: (e) => set((s) => ({ dcaEntries: [...s.dcaEntries, e] })),
      removeDCAEntry: (id) =>
        set((s) => ({ dcaEntries: s.dcaEntries.filter((e) => e.id !== id) })),

      setPrice: (ticker, data) =>
        set((s) => ({ priceCache: { ...s.priceCache, [ticker]: data } })),

      markPricesStale: () =>
        set((s) => ({
          priceCache: Object.fromEntries(
            Object.entries(s.priceCache).map(([k, v]) => [k, { ...v, stale: true }])
          ),
        })),

      setUsdthbRate: (rate) => set({ usdthbRate: rate }),

      exportJSON: () => {
        const { assets, dcaEntries, usdthbRate } = get();
        return JSON.stringify({ assets, dcaEntries, usdthbRate }, null, 2);
      },

      importJSON: (json) => {
        const data = JSON.parse(json) as {
          assets: PortfolioAsset[];
          dcaEntries: DCAEntry[];
          usdthbRate: number;
        };
        set({
          assets: data.assets ?? DEFAULT_ASSETS,
          dcaEntries: data.dcaEntries ?? [],
          usdthbRate: data.usdthbRate ?? 35,
        });
      },
    }),
    { name: "lakoi-growth-portfolio" }
  )
);

/**
 * Returns USD value for an asset.
 * DCA path: units × livePrice (already in USD).
 * Manual path: manualValueTHB ÷ usdthbRate.
 */
export function assetCurrentValue(
  assetId: string,
  manualValueTHB: number,
  dcaEntries: DCAEntry[],
  price: number | undefined,
  usdthbRate: number
): number {
  const entries = dcaEntries.filter((e) => e.assetId === assetId);
  if (entries.length > 0 && price !== undefined) {
    const units = entries.reduce((sum, e) => sum + e.unitsAdded, 0);
    return units * price;
  }
  return usdthbRate > 0 ? manualValueTHB / usdthbRate : 0;
}

export function assetTotalUnits(assetId: string, dcaEntries: DCAEntry[]): number {
  return dcaEntries
    .filter((e) => e.assetId === assetId)
    .reduce((sum, e) => sum + e.unitsAdded, 0);
}

/** Returns current USD value using HW+EX breakdown → unitsHeld → DCA entries → manualValueTHB priority. */
export function assetValueUsd(
  asset: PortfolioAsset,
  dcaEntries: DCAEntry[],
  price: number | undefined,
  usdthbRate: number
): number {
  if (asset.hardWalletUnits !== undefined || asset.exchangeUnits !== undefined) {
    const totalUnits = (asset.hardWalletUnits ?? 0) + (asset.exchangeUnits ?? 0);
    if (price !== undefined) return totalUnits * price;
    return usdthbRate > 0 ? (asset.manualValueTHB ?? 0) / usdthbRate : 0;
  }
  const held = asset.unitsHeld ?? 0;
  if (held > 0 && price !== undefined) return held * price;
  const dcaUnits = assetTotalUnits(asset.id, dcaEntries);
  if (dcaUnits > 0 && price !== undefined) return dcaUnits * price;
  return usdthbRate > 0 ? (asset.manualValueTHB ?? 0) / usdthbRate : 0;
}
