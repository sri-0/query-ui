import type { ApiField, Filter, QueryRequest, SchemaResponse, Sort } from "@/lib/api/types";
import type { QueryTabState } from "@/lib/store/tabs";
import { toISO } from "./dates";
import { MODEL_COLUMN, facetable } from "./to-table-schema";

/** Data-table state keys that are not column filters (see the extra fields in query-tab.tsx). */
export const STATE_KEYS = new Set(["sort", "uuid"]);

function isEmpty(v: unknown) {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}


/** Converts one data-table filter value into typed API filters. */
export function columnFilterToApi(field: ApiField, value: unknown): Filter[] {
  const name = field.name;
  if (isEmpty(value)) return [];

  if (Array.isArray(value)) {
    switch (field.type) {
      case "date": {
        const [from, to] = value;
        if (isEmpty(from) && isEmpty(to)) return [];
        return [{ field: name, op: "between", value: [toISO(from), toISO(to)] }];
      }
      case "integer":
      case "float": {
        const nums = value.filter((v) => typeof v === "number") as number[];
        if (nums.length === 0) return [];
        if (nums.length >= 2) return [{ field: name, op: "between", value: [nums[0], nums[1]] }];
        return [{ field: name, op: "gte", value: nums[0] }];
      }
      case "boolean": {
        const bools = value.filter((v) => typeof v === "boolean");
        return bools.length === 1 ? [{ field: name, op: "eq", value: bools[0] }] : [];
      }
      default:
        return [{ field: name, op: "in", value: value.filter((v) => !isEmpty(v)) }];
    }
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    switch (field.type) {
      case "text":
        return [{ field: name, op: "match", value: s }];
      case "ip":
        return [{ field: name, op: s.includes("/") ? "cidr" : "eq", value: s }];
      case "mac":
        return [{ field: name, op: "prefix", value: s }];
      default:
        return [{ field: name, op: "wildcard", value: /[*?]/.test(s) ? s : `*${s}*` }];
    }
  }
  if (typeof value === "number") return [{ field: name, op: "eq", value }];
  if (typeof value === "boolean") return [{ field: name, op: "eq", value }];
  return [];
}

/**
 * Builds the POST body for /search/query from a tab and its data-table state.
 * The `_model` checkbox narrows `indices`; all other filters map per field type.
 */
export function buildRequest(
  tab: QueryTabState,
  schema: SchemaResponse,
  state: Record<string, unknown>,
  opts: { size?: number; histogramSeries?: string } = {},
): Omit<QueryRequest, "cursor" | "meta"> {
  const byName = new Map(schema.fields.map((f) => [f.name, f]));
  const filters: Filter[] = [...tab.advanced];
  let indices = tab.models.length ? [...tab.models] : schema.models.map((m) => m.name);

  for (const [key, value] of Object.entries(state)) {
    if (STATE_KEYS.has(key) || isEmpty(value)) continue;
    if (key === MODEL_COLUMN && Array.isArray(value)) {
      indices = indices.filter((m) => value.includes(m));
      if (indices.length === 0) indices = value as string[];
      continue;
    }
    const field = byName.get(key);
    if (!field) continue;
    filters.push(...columnFilterToApi(field, value));
  }

  const sort: Sort[] = [];
  const s = state.sort as { id: string; desc: boolean } | null | undefined;
  if (s?.id && byName.get(s.id)?.sortable) sort.push({ field: s.id, order: s.desc ? "desc" : "asc" });

  const facets = schema.fields.filter((f) => facetable(f) && indices.some((m) => f.models.includes(m))).map((f) => f.name);

  const series =
    opts.histogramSeries !== undefined
      ? opts.histogramSeries || undefined
      : (indices.length > 1
      ? MODEL_COLUMN
      : schema.fields.find((f) => f.enum && f.ui?.cell === "level" && !f.conflict)?.name ??
        schema.fields.find((f) => f.enum && (f.name === "severity" || f.name === "level"))?.name);

  const body: Omit<QueryRequest, "cursor" | "meta"> = {
    indices,
    filters,
    sort,
    size: opts.size ?? 50,
    facets,
  };
  if (tab.lucene.trim()) body.lucene = tab.lucene.trim();
  if (tab.text.trim()) body.text = tab.text.trim();
  if (tab.semantic.trim()) body.semantic = { text: tab.semantic.trim(), k: 200 };
  if (schema.timeField) body.histogram = { field: schema.timeField, interval: "auto", series };
  return body;
}

/** Dates cannot be persisted as JSON; store epoch ms and revive by schema. */
export function serializeState(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (isEmpty(v)) continue;
    out[k] = Array.isArray(v) ? v.map((x) => (x instanceof Date ? x.getTime() : x)) : v;
  }
  return out;
}

export function reviveState(state: Record<string, unknown>, schema: SchemaResponse): Record<string, unknown> {
  const dates = new Set(schema.fields.filter((f) => f.type === "date").map((f) => f.name));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    out[k] = dates.has(k) && Array.isArray(v) ? v.map((x) => (typeof x === "number" ? new Date(x) : x)) : v;
  }
  return out;
}
