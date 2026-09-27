"use client";

import { DatePickerWithRange } from "@/components/custom/date-picker-with-range";
import { MultiSelect } from "@/components/query/multi-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { valuesOptions } from "@/lib/api/query-options";
import type { ApiField, Op } from "@/lib/api/types";
import { editorFor, isMultiOp } from "@/lib/schema/builder";
import { datePresets } from "@/lib/schema/to-table-schema";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import type { DateRange } from "react-day-picker";

type Props = {
  field: ApiField;
  op: Op;
  models: string[];
  value: unknown;
  onChange: (value: unknown) => void;
};

/**
 * Renders the right control for a field/operator pair, using the same
 * primitives as the filter sidebar (date range picker, option lists, toggles).
 */
export function ValueEditor(props: Props) {
  switch (editorFor(props.field, props.op)) {
    case "none":
      return <p className="py-2 text-xs text-muted-foreground">No value needed.</p>;
    case "date-range":
      return <DateRangeEditor {...props} />;
    case "date":
      return <TextInput {...props} placeholder="2026-09-01T00:00:00Z or now-24h" />;
    case "number":
      return <NumberInput value={props.value as number | undefined} onChange={props.onChange} />;
    case "number-range":
      return <NumberRangeEditor {...props} />;
    case "boolean":
      return <BooleanEditor {...props} />;
    case "options":
      return <OptionsEditor {...props} />;
    case "ip":
      return <TextInput {...props} placeholder={props.op === "cidr" ? "10.0.0.0/8" : "192.168.1.10"} />;
    case "geo-distance":
      return <GeoDistanceEditor {...props} />;
    case "json":
      return <JsonEditor {...props} />;
    default:
      return <TextInput {...props} placeholder={props.op === "wildcard" ? "web-0*" : props.field.type === "mac" ? "00:1a:2b" : "value"} />;
  }
}

function TextInput({ value, onChange, placeholder }: Props & { placeholder: string }) {
  return (
    <Input
      value={typeof value === "string" ? value : ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono text-xs"
    />
  );
}

function NumberInput({ value, onChange, placeholder = "number" }: { value?: number; onChange: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <Input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className="font-mono text-xs"
    />
  );
}

function NumberRangeEditor({ value, onChange }: Props) {
  const [a, b] = (Array.isArray(value) ? value : [undefined, undefined]) as [number | undefined, number | undefined];
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput value={a} onChange={(v) => onChange([v ?? null, b ?? null])} placeholder="from" />
      <NumberInput value={b} onChange={(v) => onChange([a ?? null, v ?? null])} placeholder="to" />
    </div>
  );
}

function DateRangeEditor({ value, onChange }: Props) {
  const [from, to] = (Array.isArray(value) ? value : [null, null]) as [Date | string | null, Date | string | null];
  const range: DateRange | undefined =
    from instanceof Date || to instanceof Date ? { from: from instanceof Date ? from : undefined, to: to instanceof Date ? to : undefined } : undefined;
  const presets = React.useMemo(() => datePresets(), []);
  return (
    <div className="grid gap-1.5">
      <DatePickerWithRange date={range} setDate={(d) => onChange([d?.from ?? null, d?.to ?? null])} presets={presets} />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={typeof from === "string" ? from : ""}
          placeholder="or date math, e.g. now-7d"
          onChange={(e) => onChange([e.target.value || null, to])}
          className="font-mono text-xs"
        />
        <Input
          value={typeof to === "string" ? to : ""}
          placeholder="e.g. now"
          onChange={(e) => onChange([from, e.target.value || null])}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

function BooleanEditor({ value, onChange }: Props) {
  return (
    <ToggleGroup type="single" variant="outline" value={value === true ? "true" : value === false ? "false" : ""} onValueChange={(v) => v && onChange(v === "true")}>
      <ToggleGroupItem value="true">true</ToggleGroupItem>
      <ToggleGroupItem value="false">false</ToggleGroupItem>
    </ToggleGroup>
  );
}

/** Enum values from the schema, otherwise the field's distinct values from the API. */
function OptionsEditor({ field, op, models, value, onChange }: Props) {
  const [q, setQ] = React.useState("");
  const remote = !field.enum;
  const values = useQuery(valuesOptions({ indices: models, field: field.name, prefix: q || undefined, size: 50 }, remote));
  const options = field.enum
    ? field.enum.map((v) => ({ value: v }))
    : (values.data?.values ?? []).map((v) => ({ value: String(v.value), hint: v.total.toLocaleString() }));
  const multi = isMultiOp(op);
  const selected = multi ? ((value as string[] | undefined) ?? []) : typeof value === "string" ? [value] : [];
  return (
    <MultiSelect
      value={selected}
      onChange={(next) => onChange(multi ? next : next.at(-1))}
      options={options}
      emptyLabel={multi ? "Pick values" : "Pick a value"}
      onSearch={remote ? setQ : undefined}
      loading={values.isLoading}
    />
  );
}

function GeoDistanceEditor({ value, onChange }: Props) {
  const g = ((value ?? {}) as { lat?: number; lon?: number; distance?: string });
  const set = (patch: Partial<typeof g>) => onChange({ ...g, ...patch });
  return (
    <div className="grid grid-cols-3 gap-2">
      <NumberInput value={g.lat} onChange={(lat) => set({ lat })} placeholder="lat" />
      <NumberInput value={g.lon} onChange={(lon) => set({ lon })} placeholder="lon" />
      <Input value={g.distance ?? ""} placeholder="25km" onChange={(e) => set({ distance: e.target.value })} className="font-mono text-xs" />
    </div>
  );
}

function JsonEditor({ value, onChange }: Props) {
  const [text, setText] = React.useState(value === undefined ? "" : JSON.stringify(value, null, 2));
  const [bad, setBad] = React.useState(false);
  return (
    <div className="grid gap-1">
      <Textarea
        value={text}
        rows={4}
        placeholder="GeoJSON or points as JSON"
        className="font-mono text-xs"
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setBad(false);
          } catch {
            onChange(undefined);
            setBad(true);
          }
        }}
      />
      {bad && <p className="text-xs text-destructive">Invalid JSON</p>}
    </div>
  );
}
