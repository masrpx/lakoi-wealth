import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Asset, Liability, InvestmentItem, CustomExpenseItem } from "@/types";

interface BalanceSheetState {
  assets: Asset[];
  liabilities: Liability[];
  monthlyIncome: number;
  monthlyExpense: number;
  currentAge: number;
  name: string;
  propertyGrowthRate: number;
  goldGrowthRate: number;
  investments: InvestmentItem[];
  customExpenses: CustomExpenseItem[];

  addAsset(a: Asset): void;
  updateAsset(id: string, u: Partial<Asset>): void;
  removeAsset(id: string): void;

  addLiability(l: Liability): void;
  updateLiability(id: string, u: Partial<Liability>): void;
  removeLiability(id: string): void;

  setProfile(income: number, expense: number, age: number): void;
  setName(name: string): void;
  setGrowthAssumptions(propertyRate: number, goldRate: number): void;

  setInvestments(items: InvestmentItem[]): void;
  addInvestment(inv: InvestmentItem): void;
  updateInvestment(id: string, updates: Partial<InvestmentItem>): void;
  removeInvestment(id: string): void;
  updateInvestmentDCA(id: string, monthlyDCA: number): void;

  addCustomExpense(item: CustomExpenseItem): void;
  removeCustomExpense(id: string): void;
  updateCustomExpense(id: string, updates: Partial<Omit<CustomExpenseItem, "id">>): void;

  seed(data: {
    assets: Asset[];
    liabilities: Liability[];
    monthlyIncome: number;
    monthlyExpense: number;
    currentAge: number;
    name?: string;
    propertyGrowthRate?: number;
    goldGrowthRate?: number;
    investments?: InvestmentItem[];
    customExpenses?: CustomExpenseItem[];
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
      investments: [],
      customExpenses: [],

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

      setInvestments: (investments) => set({ investments }),

      addInvestment: (inv) =>
        set((s) => ({ investments: [...s.investments, inv] })),

      updateInvestment: (id, updates) =>
        set((s) => ({
          investments: s.investments.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        })),

      removeInvestment: (id) =>
        set((s) => ({ investments: s.investments.filter((inv) => inv.id !== id) })),

      updateInvestmentDCA: (id, monthlyDCA) =>
        set((s) => ({
          investments: s.investments.map((inv) =>
            inv.id === id ? { ...inv, monthlyDCA } : inv
          ),
        })),

      addCustomExpense: (item) =>
        set((s) => ({ customExpenses: [...s.customExpenses, item] })),

      removeCustomExpense: (id) =>
        set((s) => ({ customExpenses: s.customExpenses.filter((e) => e.id !== id) })),

      updateCustomExpense: (id, updates) =>
        set((s) => ({
          customExpenses: s.customExpenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      seed: (data) =>
        set({
          ...data,
          name: data.name ?? "",
          propertyGrowthRate: data.propertyGrowthRate ?? 3,
          goldGrowthRate: data.goldGrowthRate ?? 0,
          investments: data.investments ?? [],
          customExpenses: data.customExpenses ?? [],
        }),
    }),
    { name: "lakoi-balance-sheet" }
  )
);
