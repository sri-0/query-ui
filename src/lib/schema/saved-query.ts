import type { SavedQuery } from "@/lib/api/types";
import type { QueryTabState } from "@/lib/store/tabs";
import { describeFilter } from "./builder";

/** Rebuilds tab state from an audited query so it can be reopened or shared. */
export function savedQueryToTab(q: SavedQuery): Partial<QueryTabState> & { title?: string } {
  const r = q.request;
  const mode = r.semantic ? "semantic" : r.text ? "text" : r.lucene ? "lucene" : "builder";
  return {
    models: r.indices ?? q.indices,
    lucene: r.lucene ?? "",
    text: r.text ?? "",
    semantic: r.semantic?.text ?? "",
    advanced: r.filters ?? [],
    mode,
    lastQueryId: q.id,
  };
}

/** One-line summary of an audited query for lists. */
export function describeSavedQuery(q: SavedQuery): string {
  if (q.lucene) return q.lucene;
  if (q.semantic) return `~ ${q.semantic}`;
  if (q.text) return `"${q.text}"`;
  const filters = q.request.filters ?? [];
  return filters.length ? filters.map(describeFilter).join(" · ") : "match all";
}
