import type { DatePreset } from "@/components/data-table/types";
import type { ApiField, SchemaResponse } from "@/lib/api/types";
import { col, createTableSchema, type ColBuilder } from "@/lib/table-schema";
import type { TableSchemaDefinition } from "@/lib/table-schema/types";
import { ARRAY_DELIMITER } from "@/lib/delimiters";
import { field, type SchemaDefinition } from "@/lib/store/schema";
import { subDays, subHours, subMinutes } from "date-fns";

export const MODEL_COLUMN = "_model";
export const INDEX_COLUMN = "_index";
export const ID_COLUMN = "_id";

/** Keyword fields rendered as ids get a free-text filter instead of facets. */
const ID_CELLS = new Set(["code"]);

const LEVEL_COLORS: Record<string, string> = {
  debug: "var(--muted-foreground)",
  info: "var(--info)",
  warn: "var(--warning)",
  warning: "var(--warning)",
  error: "var(--error)",
  low: "var(--info)",
  medium: "var(--warning)",
  high: "var(--error)",
  critical: "var(--error)",
};

function datePresets(): DatePreset[] {
  const now = new Date();
  return [
    { label: "Last 15 minutes", shortcut: "15m", from: subMinutes(now, 15), to: now },
    { label: "Last hour", shortcut: "1h", from: subHours(now, 1), to: now },
    { label: "Last 24 hours", shortcut: "24h", from: subHours(now, 24), to: now },
    { label: "Last 7 days", shortcut: "7d", from: subDays(now, 7), to: now },
    { label: "Last 30 days", shortcut: "30d", from: subDays(now, 30), to: now },
  ];
}

type Display = "text" | "code" | "boolean" | "badge" | "timestamp" | "star" | "status-code" | "level-indicator";
const DISPLAYS = new Set<Display>(["text", "code", "boolean", "badge", "timestamp", "star", "status-code", "level-indicator"]);

function displayFor(cell: string | undefined, fallback: Display): Display {
  return cell && DISPLAYS.has(cell as Display) ? (cell as Display) : fallback;
}

function labelFor(f: ApiField) {
  return f.ui?.label ?? f.name;
}

/** Fields the API can facet for this field type (terms or stats). */
export function facetable(f: ApiField): boolean {
  if (f.conflict || !f.aggregatable) return false;
  if (f.type === "ip" || f.type === "mac" || f.type === "date") return false;
  if (f.type === "keyword" && ID_CELLS.has(f.ui?.cell ?? "")) return false;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCol = ColBuilder<any, any>;

function toCol(f: ApiField, allModels: number): AnyCol | null {
  const common = f.models.length === allModels;
  const hidden = f.ui?.hidden || f.ui?.defaultVisible === false || !common;
  let c: AnyCol;

  if (f.conflict) {
    c = col.string().notFilterable().display("code").sortable(false);
  } else {
    switch (f.type) {
      case "vector":
        return null;
      case "date":
        c = col.timestamp().filterable("timerange", { presets: datePresets() }).minSize(180);
        break;
      case "boolean":
        c = col.boolean().filterable("checkbox").size(90);
        break;
      case "integer":
      case "float":
        c = col.number().filterable("slider", { min: 0, max: 1 }).size(110);
        if (f.ui?.cell === "status-code") c = c.display("status-code").size(80);
        break;
      case "keyword": {
        if (f.array) {
          c = col.array(f.enum ? col.enum(f.enum) : col.string()).filterable("checkbox").display("badge").size(160);
        } else if (f.enum) {
          c = col
            .enum(f.enum)
            .filterable("checkbox", { options: f.enum.map((v) => ({ label: v, value: v })) })
            .display(f.ui?.cell === "level" ? "level-indicator" : "badge", {
              colorMap: Object.fromEntries(f.enum.filter((v) => LEVEL_COLORS[v]).map((v) => [v, LEVEL_COLORS[v]])),
            })
            .size(f.ui?.cell === "level" ? 40 : 110);
          if (f.ui?.cell === "level") c = c.hideHeader();
        } else if (facetable(f)) {
          // An enum with no known values: options are filled from server facets
          // (applyFacets) and the filter schema is widened in `widenFilterSchema`.
          c = col.enum([] as string[]).filterable("checkbox").display(f.ui?.cell === "badge" ? "badge" : "text").size(140);
        } else {
          c = col.string().filterable("input").display(displayFor(f.ui?.cell, "code")).size(200);
        }
        break;
      }
      case "ip":
      case "mac":
        c = col.string().filterable("input").display("code").size(150);
        break;
      case "text":
        c = col.string().filterable("input").display("text").minSize(260).sortable(false);
        break;
      case "geo_point":
        c = col.string().notFilterable().display("code").sortable(false).size(170);
        break;
      case "geo_shape":
      case "object":
        c = col.record().display("text").sortable(false).size(180);
        break;
      default:
        c = col.string().filterable("input");
    }
  }
  c = c.label(labelFor(f)).sheet();
  if (f.description) c = c.description(f.description);
  if (!f.sortable) c = c.sortable(false);
  if (hidden) c = c.hidden();
  return c;
}

/**
 * Builds the data-table schema for a set of models from the API schema. The
 * time field leads, the model badge column follows when more than one model
 * is selected, then the remaining fields in the API's order.
 */
export function toTableSchema(schema: SchemaResponse) {
  const def: TableSchemaDefinition = {};
  const modelNames = schema.models.map((m) => m.name);
  const time = schema.timeField;

  if (time) {
    const tf = schema.fields.find((f) => f.name === time);
    if (tf) {
      const c = toCol(tf, schema.models.length);
      if (c) def[time] = c.defaultOpen().commandDisabled().minSize(200);
    }
  }
  // OpenSearch meta columns. Leading and visible when several models are
  // searched; available from the column picker otherwise.
  const multi = modelNames.length > 1;
  let modelCol = col
    .enum(modelNames)
    .label("Model")
    .display("badge")
    .filterable("checkbox", { options: modelNames.map((m) => ({ label: m, value: m })) })
    .size(110)
    .sheet();
  if (multi) modelCol = modelCol.defaultOpen();
  else modelCol = modelCol.hidden();
  def[MODEL_COLUMN] = modelCol;
  let indexCol = col.string().notFilterable().label("Index").display("code").sortable(false).size(140).sheet();
  let idCol = col.string().notFilterable().label("Doc ID").display("code").sortable(false).size(200).sheet();
  if (!multi) {
    indexCol = indexCol.hidden();
    idCol = idCol.hidden();
  }
  def[INDEX_COLUMN] = indexCol;
  def[ID_COLUMN] = idCol;
  for (const f of schema.fields) {
    if (f.name === time) continue;
    const c = toCol(f, schema.models.length);
    if (c) def[f.name] = c;
  }
  return createTableSchema(def);
}

/**
 * Keyword columns built as `col.enum([])` would reject every typed value in
 * the command bar (stringLiteral parsing). Replace their filter fields with
 * plain string arrays so `host:web-01` round-trips.
 */
export function widenFilterSchema(def: SchemaDefinition, schema: SchemaResponse): SchemaDefinition {
  const out = { ...def };
  for (const f of schema.fields) {
    if (f.type === "keyword" && !f.enum && !f.array && facetable(f) && out[f.name]) {
      out[f.name] = field.array(field.string()).delimiter(ARRAY_DELIMITER);
    }
  }
  return out;
}
