"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Filter } from "@/lib/api/types";

/** Everything a query tab needs to be recreated after a reload. */
export type QueryTabState = {
  /** Model names; empty = all models. */
  models: string[];
  /** Serialized data-table filter state (Dates as epoch ms). */
  filters: Record<string, unknown>;
  /** Lucene query string (query_string). */
  lucene: string;
  /** Free-text search across text fields. */
  text: string;
  /** Semantic (k-NN) search text. */
  semantic: string;
  /** Typed filters from the query builder that the sidebar cannot express (geo, CIDR, exists...). */
  advanced: Filter[];
  /** Open the query builder as soon as the tab mounts. */
  openBuilder?: boolean;
};

export type Tab =
  | { id: "home"; kind: "home"; title: string }
  | ({ id: string; kind: "query"; title: string; createdAt: number } & QueryTabState);

export type QueryTab = Extract<Tab, { kind: "query" }>;

type TabsStore = {
  tabs: Tab[];
  activeId: string;
  setActive: (id: string) => void;
  openQuery: (init: Partial<QueryTabState> & { title?: string }) => string;
  updateQuery: (id: string, patch: Partial<QueryTabState> | ((t: QueryTab) => Partial<QueryTabState>)) => void;
  rename: (id: string, title: string) => void;
  close: (id: string) => void;
  reorder: (from: number, to: number) => void;
};

const HOME: Tab = { id: "home", kind: "home", title: "Home" };

const emptyState = (): QueryTabState => ({
  models: [],
  filters: {},
  lucene: "",
  text: "",
  semantic: "",
  advanced: [],
});

export const useTabs = create<TabsStore>()(
  persist(
    (set, get) => ({
      tabs: [HOME],
      activeId: "home",
      setActive: (id) => set({ activeId: id }),
      openQuery: (init) => {
        const id = crypto.randomUUID().slice(0, 8);
        const { title, ...state } = init;
        const tab: QueryTab = {
          id,
          kind: "query",
          title: title ?? defaultTitle(state.models ?? []),
          createdAt: Date.now(),
          ...emptyState(),
          ...state,
        };
        set((s) => ({ tabs: [...s.tabs, tab], activeId: id }));
        return id;
      },
      updateQuery: (id, patch) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id && t.kind === "query" ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t,
          ),
        })),
      rename: (id, title) => set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)) })),
      close: (id) => {
        const { tabs, activeId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeId;
        if (activeId === id) nextActive = (next[idx] ?? next[idx - 1] ?? HOME).id;
        set({ tabs: next, activeId: nextActive });
      },
      reorder: (from, to) =>
        set((s) => {
          const tabs = [...s.tabs];
          const [moved] = tabs.splice(from, 1);
          tabs.splice(to, 0, moved);
          return { tabs };
        }),
    }),
    { name: "query-ui.tabs", version: 1 },
  ),
);

export function defaultTitle(models: string[]) {
  if (models.length === 0) return "All models";
  if (models.length === 1) return models[0];
  return `${models[0]} +${models.length - 1}`;
}
