"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SchemaResponse } from "@/lib/api/types";
import { MODEL_COLUMN, facetable } from "@/lib/schema/to-table-schema";
import { BarChart3 } from "lucide-react";

const NONE = "__none";

/** Icon button: picks the field the histogram is grouped (and coloured) by. */
export function ChartSeriesSelect({ schema, value, onChange }: { schema: SchemaResponse; value: string; onChange: (field: string) => void }) {
  const fields = schema.fields.filter((f) => facetable(f) && (f.type === "keyword" || f.type === "boolean" || f.type === "mac"));
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-none" aria-label="Chart group by">
              <BarChart3 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Chart group by</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>Group by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
          <DropdownMenuRadioItem value={NONE} className="text-xs">None</DropdownMenuRadioItem>
          {schema.models.length > 1 && <DropdownMenuRadioItem value={MODEL_COLUMN} className="text-xs">Model</DropdownMenuRadioItem>}
          {fields.map((f) => (
            <DropdownMenuRadioItem key={f.name} value={f.name} className="font-mono text-xs">
              {f.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
