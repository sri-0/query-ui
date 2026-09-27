"use client";

import { create } from "zustand";

/** Cross-tab UI state that is not worth persisting. */
type UiStore = {
  /** The assistant panel is global: it stays open while switching tabs. */
  aiOpen: boolean;
  setAiOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** Filters panel of query tabs (one setting for all tabs). */
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** Query composer modal. `tabId` set = editing that tab; null = composing a new query. */
  composer: { open: boolean; tabId: string | null };
  openComposer: (tabId?: string) => void;
  closeComposer: () => void;
};

export const useUi = create<UiStore>()((set) => ({
  aiOpen: false,
  setAiOpen: (v) => set((s) => ({ aiOpen: typeof v === "function" ? v(s.aiOpen) : v })),
  filtersOpen: true,
  setFiltersOpen: (v) => set((s) => ({ filtersOpen: typeof v === "function" ? v(s.filtersOpen) : v })),
  composer: { open: false, tabId: null },
  openComposer: (tabId) => set({ composer: { open: true, tabId: tabId ?? null } }),
  closeComposer: () => set((s) => ({ composer: { ...s.composer, open: false } })),
}));
