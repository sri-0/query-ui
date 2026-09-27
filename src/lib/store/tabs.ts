"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Filter } from "@/lib/api/types";

/** How the query was authored; also the default mode of the query input. */
export type QueryMode = "builder" | "lucene" | "text" | "semantic";

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
  /** Typed filters from the query builder. */
  advanced: Filter[];
  mode: QueryMode;
  /** Audit id of the last executed query; used for share links. */
  lastQueryId?: string;
  /** Opened from a share link. */
  shared?: boolean;
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
  /** Replace a tab's query wholesale (composer edit). Resets sidebar filters and retitles when the models change. */
  replaceQuery: (id: string, state: QueryTabState) => void;
  rename: (id: string, title: string) => void;
  duplicate: (id: string) => void;
  close: (id: string) => void;
};

const HOME: Tab = { id: "home", kind: "home", title: "Home" };

export const emptyQueryState = (): QueryTabState => ({
  models: [],
  filters: {},
  lucene: "",
  text: "",
  semantic: "",
  advanced: [],
  mode: "builder",
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
          ...emptyQueryState(),
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
      replaceQuery: (id, state) =>
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== id || t.kind !== "query") return t;
            const modelsChanged = t.models.join() !== state.models.join();
            return {
              ...t,
              ...state,
              filters: modelsChanged ? {} : t.filters,
              title: modelsChanged ? defaultTitle(state.models) : t.title,
            };
          }),
        })),
      rename: (id, title) => set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)) })),
      duplicate: (id) => {
        const t = get().tabs.find((x) => x.id === id);
        if (t?.kind !== "query") return;
        get().openQuery({ ...queryStateOf(t), title: `${t.title} (copy)` });
      },
      close: (id) => {
        const { tabs, activeId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeId;
        if (activeId === id) nextActive = (next[idx] ?? next[idx - 1] ?? HOME).id;
        set({ tabs: next, activeId: nextActive });
      },
    }),
    { name: "query-ui.tabs", version: 2, migrate: () => ({ tabs: [HOME], activeId: "home" }) },
  ),
);

/** The query-state half of a tab, without identity or share id. */
export function queryStateOf(t: QueryTab): QueryTabState {
  return { models: t.models, filters: t.filters, lucene: t.lucene, text: t.text, semantic: t.semantic, advanced: t.advanced, mode: t.mode };
}

export const selectActiveTab = (s: { tabs: Tab[]; activeId: string }) => s.tabs.find((t) => t.id === s.activeId);

/** The active tab when it is a query tab, else undefined. */
export function useActiveQueryTab(): QueryTab | undefined {
  return useTabs((s) => {
    const t = selectActiveTab(s);
    return t?.kind === "query" ? t : undefined;
  });
}

export function useQueryTab(id: string | null): QueryTab | undefined {
  return useTabs((s) => {
    const t = id ? s.tabs.find((x) => x.id === id) : undefined;
    return t?.kind === "query" ? t : undefined;
  });
}

export function defaultTitle(models: string[]) {
  if (models.length === 0) return "All models";
  if (models.length === 1) return models[0];
  return `${models[0]} +${models.length - 1}`;
}
