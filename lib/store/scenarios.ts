import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Scenario, AppState } from "@/types";

interface ScenariosState {
  scenarios: Scenario[];
  saveScenario: (name: string, state: AppState) => void;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
}

export const useScenariosStore = create<ScenariosState>()(
  persist(
    (set) => ({
      scenarios: [],

      saveScenario: (name, state) =>
        set((s) => ({
          scenarios: [
            ...s.scenarios,
            {
              id: `sc-${Date.now()}`,
              name,
              createdAt: new Date().toISOString(),
              state: structuredClone(state),
            },
          ],
        })),

      deleteScenario: (id) =>
        set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id) })),

      renameScenario: (id, name) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) => (sc.id === id ? { ...sc, name } : sc)),
        })),
    }),
    { name: "lakoi-scenarios" }
  )
);
