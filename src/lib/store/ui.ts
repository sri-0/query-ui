"use client";

import { create } from "zustand";

/** Cross-tab UI state that is not worth persisting. */
type UiStore = {
  aiOpen: boolean;
  setAiOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
};

export const useUi = create<UiStore>()((set) => ({
  aiOpen: false,
  setAiOpen: (v) => set((s) => ({ aiOpen: typeof v === "function" ? v(s.aiOpen) : v })),
}));
