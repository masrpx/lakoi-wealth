import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Asset, Liability } from "@/types";

interface BalanceSheetState {
  assets: Asset[];
  liabilities: Liability[];
  monthlyIncome: number;
  monthlyExpense: number;
  currentAge: number;
  name: string;
  propertyGrowthRate: number;  // whole %, default 3
  goldGrowthRate: number;      // whole %, default 0

  addAsset(a: Asset): void;
  updateAsset(id: string, u: Partial<Asset>): void;
  removeAsset(id: string): void;

  addLiability(l: Liability): void;
  updateLiability(id: string, u: Partial<Liability>): void;
  removeLiability(id: string): void;

  setProfile(income: number, expense: number, age: number): void;
  setName(name: string): void;
  setGrowthAssumptions(propertyRate: number, goldRate: number): void;
  seed(data: {
    assets: Asset[];
    liabilities: Liability[];
    monthlyIncome: number;
    monthlyExpense: number;
    currentAge: number;
    name?: string;
    propertyGrowthRate?: number;
    goldGrowthRate?: number;
  }): void;
}

export const useBalanceSheetStore = create<BalanceSheetState>()(
  persist(
    (set) => ({
      assets: [],
      liabilities: [],
      monthlyIncome: 0,
      monthlyExpense: 0,
      currentAge: 35,
      name: "",
      propertyGrowthRate: 3,
      goldGrowthRate: 0,

      addAsset: (a) => set((s) => ({ assets: [...s.assets, a] })),
      updateAsset: (id, u) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...u } : a)) })),
      removeAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      addLiability: (l) => set((s) => ({ liabilities: [...s.liabilities, l] })),
      updateLiability: (id, u) =>
        set((s) => ({
          liabilities: s.liabilities.map((l) => (l.id === id ? { ...l, ...u } : l)),
        })),
      removeLiability: (id) =>
        set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) })),

      setProfile: (monthlyIncome, monthlyExpense, currentAge) =>
        set({ monthlyIncome, monthlyExpense, currentAge }),

      setName: (name) => set({ name }),

      setGrowthAssumptions: (propertyGrowthRate, goldGrowthRate) =>
        set({ propertyGrowthRate, goldGrowthRate }),

      seed: (data) =>
        set({
          ...data,
          name: data.name ?? "",
          propertyGrowthRate: data.propertyGrowthRate ?? 3,
          goldGrowthRate: data.goldGrowthRate ?? 0,
        }),
    }),
    { name: "lakoi-balance-sheet" }
  )
);
