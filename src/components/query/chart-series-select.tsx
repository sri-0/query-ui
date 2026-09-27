"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SchemaResponse } from "@/lib/api/types";
import { MODEL_COLUMN, facetable } from "@/lib/schema/to-table-schema";
import { Palette } from "lucide-react";

const NONE = "__none";

/** Picks the field that splits (and colours) the histogram series. */
export function ChartSeriesSelect({ schema, value, onChange }: { schema: SchemaResponse; value: string; onChange: (field: string) => void }) {
  const fields = schema.fields.filter((f) => facetable(f) && (f.type === "keyword" || f.type === "boolean" || f.type === "mac"));
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger size="sm" className="h-8 gap-1.5 text-xs" aria-label="Colour histogram by">
        <Palette className="size-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={NONE} className="text-xs">No split</SelectItem>
        {schema.models.length > 1 && (
          <SelectItem value={MODEL_COLUMN} className="text-xs">Model</SelectItem>
        )}
        {fields.map((f) => (
          <SelectItem key={f.name} value={f.name} className="font-mono text-xs">
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
