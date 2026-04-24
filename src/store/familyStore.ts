"use client";

import { create } from "zustand";
import type { Branch } from "@/types/family";

type ActiveView = "universe" | "timeline";
type CameraTarget = [number, number, number];

interface FamilyStore {
  selectedPersonId: string | null;
  setSelectedPerson: (id: string | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: string[];
  setSearchResults: (ids: string[]) => void;

  activeBranches: Set<Branch>;
  toggleBranch: (branch: Branch) => void;
  resetBranches: () => void;

  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;

  cameraTarget: CameraTarget | null;
  setCameraTarget: (target: CameraTarget | null) => void;
}

const ALL_BRANCHES: Branch[] = [
  "toledo_espanha",
  "rodovalho",
  "toledo_pisa",
  "toledo_rodovalho",
];

function createAllBranchesSet(): Set<Branch> {
  return new Set(ALL_BRANCHES);
}

export const useFamilyStore = create<FamilyStore>((set) => ({
  selectedPersonId: null,
  setSelectedPerson: (id) =>
    set({ selectedPersonId: id, isPanelOpen: id !== null }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (ids) => set({ searchResults: ids }),

  activeBranches: createAllBranchesSet(),
  toggleBranch: (branch) =>
    set((state) => {
      const next = new Set(state.activeBranches);
      if (next.has(branch)) {
        next.delete(branch);
      } else {
        next.add(branch);
      }

      return { activeBranches: next };
    }),
  resetBranches: () => set({ activeBranches: createAllBranchesSet() }),

  activeView: "universe",
  setActiveView: (view) => set({ activeView: view }),
  isPanelOpen: false,
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),

  cameraTarget: null,
  setCameraTarget: (target) => set({ cameraTarget: target }),
}));
