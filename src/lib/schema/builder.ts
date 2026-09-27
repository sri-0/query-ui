import type { ApiField, Filter, Op } from "@/lib/api/types";
import { fromISO, toISO } from "./dates";

/** One row of the query builder. `value` is typed per editor, never a raw string. */
export type Draft = { id: string; field: string; op: Op; value: unknown };

/** Which editor renders the value for a field/op pair. */
export type EditorKind =
  | "none"
  | "text"
  | "number"
  | "number-range"
  | "date-range"
  | "date"
  | "boolean"
  | "options" // enum / keyword: single or multi select
  | "ip"
  | "geo-distance"
  | "json";

export const OP_LABELS: Record<Op, string> = {
  eq: "equals",
  ne: "not equals",
  in: "is one of",
  not_in: "is none of",
  prefix: "starts with",
  wildcard: "matches wildcard",
  match: "contains words",
  match_phrase: "contains phrase",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  between: "between",
  cidr: "in CIDR block",
  geo_distance: "within distance of",
  geo_bounding_box: "in bounding box",
  geo_polygon: "in polygon",
  geo_shape: "intersects shape",
  exists: "exists",
  not_exists: "does not exist",
};

export function editorFor(field: ApiField, op: Op): EditorKind {
  if (op === "exists" || op === "not_exists") return "none";
  if (op === "geo_distance") return "geo-distance";
  if (op === "geo_bounding_box" || op === "geo_polygon" || op === "geo_shape") return "json";
  if (op === "cidr") return "ip";
  switch (field.type) {
    case "date":
      return op === "between" ? "date-range" : "date";
    case "integer":
    case "float":
      return op === "between" ? "number-range" : "number";
    case "boolean":
      return "boolean";
    case "ip":
      return op === "between" ? "text" : "ip";
    case "keyword":
    case "mac":
      return op === "eq" || op === "ne" || op === "in" || op === "not_in" ? "options" : "text";
    default:
      return "text";
  }
}

export function isMultiOp(op: Op) {
  return op === "in" || op === "not_in";
}

export function newDraft(field: ApiField): Draft {
  return { id: crypto.randomUUID(), field: field.name, op: field.ops[0], value: undefined };
}

/** Reset the value when the editor kind changes so stale shapes never leak into a request. */
export function withOp(d: Draft, field: ApiField, op: Op): Draft {
  return editorFor(field, d.op) === editorFor(field, op) ? { ...d, op } : { ...d, op, value: undefined };
}

export function validateDraft(d: Draft, field?: ApiField): string | undefined {
  if (!field) return "Pick a field";
  if (!field.ops.includes(d.op)) return "Operator not valid for this field";
  const v = d.value;
  switch (editorFor(field, d.op)) {
    case "none":
      return undefined;
    case "number":
      return typeof v === "number" && Number.isFinite(v) ? undefined : "Enter a number";
    case "number-range": {
      const [a, b] = Array.isArray(v) ? v : [];
      return typeof a === "number" || typeof b === "number" ? undefined : "Enter at least one bound";
    }
    case "date-range": {
      const [a, b] = Array.isArray(v) ? v : [];
      return a || b ? undefined : "Pick a date range";
    }
    case "date":
      return typeof v === "string" && v.trim() ? undefined : "Enter a date";
    case "boolean":
      return typeof v === "boolean" ? undefined : "Choose true or false";
    case "options": {
      if (isMultiOp(d.op)) return Array.isArray(v) && v.length ? undefined : "Pick at least one value";
      return typeof v === "string" && v ? undefined : "Pick a value";
    }
    case "ip":
      return typeof v === "string" && v.trim() ? undefined : "Enter an address";
    case "geo-distance": {
      const g = (v ?? {}) as { lat?: number; lon?: number; distance?: string };
      return typeof g.lat === "number" && typeof g.lon === "number" && g.distance ? undefined : "Enter lat, lon and distance";
    }
    case "json":
      return v !== undefined ? undefined : "Enter valid JSON";
    default:
      return typeof v === "string" && v.trim() ? undefined : "Enter a value";
  }
}

export function toFilter(d: Draft, field: ApiField): Filter {
  switch (editorFor(field, d.op)) {
    case "none":
      return { field: d.field, op: d.op };
    case "date-range": {
      const [a, b] = d.value as [Date | string | null, Date | string | null];
      return { field: d.field, op: d.op, value: [toISO(a), toISO(b)] };
    }
    case "json":
      return { field: d.field, op: d.op, value: d.op === "geo_shape" ? { shape: d.value } : d.value };
    default:
      return { field: d.field, op: d.op, value: d.value };
  }
}

export function fromFilter(f: Filter, field: ApiField): Draft {
  const d: Draft = { id: crypto.randomUUID(), field: f.field, op: f.op, value: f.value };
  switch (editorFor(field, f.op)) {
    case "date-range": {
      const [a, b] = (Array.isArray(f.value) ? f.value : [null, null]) as [unknown, unknown];
      return { ...d, value: [fromISO(a), fromISO(b)] };
    }
    case "json":
      return { ...d, value: f.op === "geo_shape" ? (f.value as { shape?: unknown })?.shape : f.value };
    default:
      return d;
  }
}

/** Human-readable one-liner for chips, titles and audit rows. */
export function describeFilter(f: Filter): string {
  const op = OP_LABELS[f.op] ?? f.op;
  if (f.value === undefined) return `${f.field} ${op}`;
  const v = typeof f.value === "string" ? f.value : JSON.stringify(f.value);
  return `${f.field} ${op} ${v}`;
}
