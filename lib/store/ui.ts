import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppMode, CashflowView } from "@/types";

interface UIState {
  mode: AppMode;
  cashflowView: CashflowView;
  isDemoLoaded: boolean;
  activeScenarioId: string | null;
  loadedProfileId: string | null;

  setMode: (mode: AppMode) => void;
  setCashflowView: (view: CashflowView) => void;
  setIsDemoLoaded: (loaded: boolean) => void;
  setActiveScenarioId: (id: string | null) => void;
  setLoadedProfileId: (id: string | null) => void;
  toggleMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      mode: "agent",
      cashflowView: "yearly",
      isDemoLoaded: false,
      activeScenarioId: null,
      loadedProfileId: null,

      setMode: (mode) => set({ mode }),
      setCashflowView: (view) => set({ cashflowView: view }),
      setIsDemoLoaded: (loaded) => set({ isDemoLoaded: loaded }),
      setActiveScenarioId: (id) => set({ activeScenarioId: id }),
      setLoadedProfileId: (id) => set({ loadedProfileId: id }),
      toggleMode: () =>
        set({ mode: get().mode === "agent" ? "presentation" : "agent" }),
    }),
    { name: "lakoi-ui" }
  )
);
