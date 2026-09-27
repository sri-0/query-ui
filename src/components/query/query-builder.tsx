"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelSelect } from "./model-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { valuesOptions } from "@/lib/api/query-options";
import type { ApiField, Filter, Op, SchemaResponse } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";

const OP_LABELS: Record<Op, string> = {
  eq: "equals", ne: "not equals", in: "is one of", not_in: "is none of", prefix: "starts with",
  wildcard: "matches wildcard", match: "contains words", match_phrase: "contains phrase",
  gt: ">", gte: ">=", lt: "<", lte: "<=", between: "between", cidr: "in CIDR block",
  geo_distance: "within distance of", geo_bounding_box: "in bounding box", geo_polygon: "in polygon",
  geo_shape: "intersects shape", exists: "exists", not_exists: "does not exist",
};

type Draft = { field: string; op: Op; value: string; value2: string; extra: string };

/**
 * Schema-driven builder: field → operator (from the field's ops) → typed value.
 * Produces typed API filters, so anything the sidebar cannot express (geo,
 * CIDR, exists, negation) is available here.
 */
export function QueryBuilder({
  open, onOpenChange, schema, models, onModelsChange, filters, onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Merged schema of the selected models: the only source of fields and operators. */
  schema: SchemaResponse;
  models: string[];
  onModelsChange: (models: string[]) => void;
  filters: Filter[];
  onApply: (filters: Filter[]) => void;
}) {
  const fields = React.useMemo(() => schema.fields.filter((f) => f.type !== "vector" && !f.conflict && f.ops.length > 0), [schema]);
  const [rows, setRows] = React.useState<Draft[]>(() => (filters.length ? filters.map(toDraft) : [emptyRow(fields[0])]));
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setRows(filters.length ? filters.map(toDraft) : [emptyRow(fields[0])]);
  }

  const update = (i: number, patch: Partial<Draft>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const byName = new Map(fields.map((f) => [f.name, f]));
  const errors = rows.map((r) => validateRow(r, byName.get(r.field)));
  const valid = errors.every((e) => !e);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="mx-auto max-h-[80svh] w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>Query builder</SheetTitle>
          <SheetDescription>Pick the models, then add typed filters. Rows are combined with AND.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Models</Label>
            <ModelSelect value={models} onChange={onModelsChange} />
          </div>
          <Label className="text-xs text-muted-foreground">Filters</Label>
          {rows.map((row, i) => {
            const f = byName.get(row.field);
            return (
              <div key={i} className="grid grid-cols-[minmax(140px,1fr)_minmax(140px,180px)_2fr_auto] items-start gap-2">
                <Select value={row.field} onValueChange={(v) => update(i, { ...emptyRow(byName.get(v)!), field: v })}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue placeholder="Field" /></SelectTrigger>
                  <SelectContent>
                    {fields.map((fl) => (
                      <SelectItem key={fl.name} value={fl.name} className="font-mono text-xs">
                        {fl.name} <span className="ml-2 text-muted-foreground">{fl.type}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={row.op} onValueChange={(v) => update(i, { op: v as Op })}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(f?.ops ?? []).map((op) => (
                      <SelectItem key={op} value={op} className="text-xs">{OP_LABELS[op]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-1">
                  {f && <ValueInput field={f} models={models} row={row} onChange={(p) => update(i, p)} />}
                  {errors[i] && <p className="text-xs text-destructive">{errors[i]}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} aria-label="Remove">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="self-start" onClick={() => setRows((r) => [...r, emptyRow(fields[0])])}>
            <Plus className="size-4" /> Add filter
          </Button>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => { onApply([]); onOpenChange(false); }}>Clear</Button>
          <Button disabled={!valid} onClick={() => { onApply(rows.map((r) => toFilter(r, byName.get(r.field)!)).filter(Boolean) as Filter[]); onOpenChange(false); }}>
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ValueInput({ field, models, row, onChange }: { field: ApiField; models: string[]; row: Draft; onChange: (p: Partial<Draft>) => void }) {
  const wantsValues = field.aggregatable && (field.type === "keyword" || field.type === "boolean") && (row.op === "eq" || row.op === "ne" || row.op === "in" || row.op === "not_in");
  const values = useQuery(valuesOptions({ indices: models, field: field.name, size: 50 }, wantsValues && !field.enum));
  const options = field.enum ?? values.data?.values.map((v) => String(v.value));

  switch (row.op) {
    case "exists":
    case "not_exists":
      return <p className="py-2 text-xs text-muted-foreground">No value needed.</p>;
    case "between":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder={field.type === "date" ? "from, e.g. now-7d" : "from"} value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />
          <Input placeholder={field.type === "date" ? "to, e.g. now" : "to"} value={row.value2} onChange={(e) => onChange({ value2: e.target.value })} className="font-mono text-xs" />
        </div>
      );
    case "geo_distance":
      return (
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="lat" value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />
          <Input placeholder="lon" value={row.value2} onChange={(e) => onChange({ value2: e.target.value })} className="font-mono text-xs" />
          <Input placeholder="distance, e.g. 25km" value={row.extra} onChange={(e) => onChange({ extra: e.target.value })} className="font-mono text-xs" />
        </div>
      );
    case "geo_bounding_box":
      return <Input placeholder='{"top_left":{"lat":..,"lon":..},"bottom_right":{"lat":..,"lon":..}}' value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />;
    case "geo_polygon":
    case "geo_shape":
      return <Input placeholder="GeoJSON / points as JSON" value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />;
    case "in":
    case "not_in":
      return <Input list={options ? `opts-${field.name}` : undefined} placeholder="comma-separated values" value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />;
    default:
      if (field.type === "boolean") {
        return (
          <Select value={row.value} onValueChange={(v) => onChange({ value: v })}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="true / false" /></SelectTrigger>
            <SelectContent><SelectItem value="true">true</SelectItem><SelectItem value="false">false</SelectItem></SelectContent>
          </Select>
        );
      }
      if (options && (row.op === "eq" || row.op === "ne")) {
        return (
          <>
            <Input list={`opts-${field.name}`} placeholder="value" value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />
            <datalist id={`opts-${field.name}`}>{options.map((o) => <option key={o} value={o} />)}</datalist>
          </>
        );
      }
      return <Input placeholder={placeholderFor(field, row.op)} value={row.value} onChange={(e) => onChange({ value: e.target.value })} className="font-mono text-xs" />;
  }
}

function placeholderFor(f: ApiField, op: Op) {
  if (op === "cidr") return "10.0.0.0/8";
  if (f.type === "ip") return "192.168.1.10";
  if (f.type === "mac") return "00:1a:2b";
  if (f.type === "date") return "2026-09-01T00:00:00Z or now-24h";
  if (op === "wildcard") return "web-0*";
  return "value";
}

function emptyRow(f?: ApiField): Draft {
  return { field: f?.name ?? "", op: f?.ops[0] ?? "eq", value: "", value2: "", extra: "" };
}

function toDraft(f: Filter): Draft {
  const v = f.value;
  if (f.op === "between" && Array.isArray(v)) return { field: f.field, op: f.op, value: str(v[0]), value2: str(v[1]), extra: "" };
  if (f.op === "geo_distance" && v && typeof v === "object") {
    const g = v as { lat: number; lon: number; distance: string };
    return { field: f.field, op: f.op, value: String(g.lat), value2: String(g.lon), extra: g.distance };
  }
  if (Array.isArray(v)) return { field: f.field, op: f.op, value: v.map(String).join(", "), value2: "", extra: "" };
  if (v && typeof v === "object") return { field: f.field, op: f.op, value: JSON.stringify(v), value2: "", extra: "" };
  return { field: f.field, op: f.op, value: v === undefined ? "" : String(v), value2: "", extra: "" };
}

function str(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

function coerce(f: ApiField, s: string): unknown {
  const t = s.trim();
  switch (f.type) {
    case "integer":
    case "float": {
      const n = Number(t);
      return Number.isFinite(n) ? n : t;
    }
    case "boolean":
      return t === "true";
    default:
      return t;
  }
}

function validateRow(r: Draft, f?: ApiField): string | undefined {
  if (!f) return "Pick a field";
  if (!f.ops.includes(r.op)) return "Operator not valid for this field";
  if (r.op === "exists" || r.op === "not_exists") return undefined;
  if (r.op === "between") return r.value.trim() || r.value2.trim() ? undefined : "Enter at least one bound";
  if (r.op === "geo_distance") return r.value && r.value2 && r.extra ? undefined : "Enter lat, lon and distance";
  if (r.op === "geo_bounding_box" || r.op === "geo_polygon" || r.op === "geo_shape") {
    try { JSON.parse(r.value); return undefined; } catch { return "Enter valid JSON"; }
  }
  if (!r.value.trim()) return "Enter a value";
  if ((f.type === "integer" || f.type === "float") && r.op !== "in" && r.op !== "not_in" && !Number.isFinite(Number(r.value))) return "Enter a number";
  return undefined;
}

function toFilter(r: Draft, f: ApiField): Filter | null {
  switch (r.op) {
    case "exists":
    case "not_exists":
      return { field: r.field, op: r.op };
    case "between":
      return { field: r.field, op: r.op, value: [r.value.trim() ? coerce(f, r.value) : null, r.value2.trim() ? coerce(f, r.value2) : null] };
    case "in":
    case "not_in":
      return { field: r.field, op: r.op, value: r.value.split(",").map((s) => coerce(f, s)).filter((v) => v !== "") };
    case "geo_distance":
      return { field: r.field, op: r.op, value: { lat: Number(r.value), lon: Number(r.value2), distance: r.extra.trim() } };
    case "geo_bounding_box":
    case "geo_polygon":
      return { field: r.field, op: r.op, value: JSON.parse(r.value) };
    case "geo_shape":
      return { field: r.field, op: r.op, value: { shape: JSON.parse(r.value) } };
    default:
      return { field: r.field, op: r.op, value: coerce(f, r.value) };
  }
}
