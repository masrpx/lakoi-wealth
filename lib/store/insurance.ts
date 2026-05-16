import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InsurancePolicy } from "@/types/insurance";

interface InsuranceState {
  policies: InsurancePolicy[];

  addPolicy: (policy: InsurancePolicy) => void;
  updatePolicy: (id: string, updates: Partial<InsurancePolicy>) => void;
  removePolicy: (id: string) => void;
  getPolicyById: (id: string) => InsurancePolicy | undefined;
  clearPolicies: () => void;
  loadPolicies: (policies: InsurancePolicy[]) => void;
}

export const useInsuranceStore = create<InsuranceState>()(
  persist(
    (set, get) => ({
      policies: [],

      addPolicy: (policy) =>
        set((state) => ({ policies: [...state.policies, policy] })),

      updatePolicy: (id, updates) =>
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? ({ ...p, ...updates } as InsurancePolicy) : p
          ),
        })),

      removePolicy: (id) =>
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
        })),

      getPolicyById: (id) => get().policies.find((p) => p.id === id),

      clearPolicies: () => set({ policies: [] }),

      loadPolicies: (policies) => set({ policies }),
    }),
    { name: "lakoi-insurance" }
  )
);
