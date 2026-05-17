import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Goal } from "@/types";

interface GoalState {
  goals: Goal[];
  addGoal(g: Goal): void;
  updateGoal(id: string, updates: Partial<Goal>): void;
  removeGoal(id: string): void;
  loadGoals(goals: Goal[]): void;
}

export const useGoalsStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
      updateGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      loadGoals: (goals) => set({ goals }),
    }),
    { name: "lakoi-goals" }
  )
);
