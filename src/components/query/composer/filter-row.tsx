"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiField, Op } from "@/lib/api/types";
import { OP_LABELS, newDraft, withOp, type Draft } from "@/lib/schema/builder";
import { ChevronsUpDown, Trash2 } from "lucide-react";
import * as React from "react";
import { ValueEditor } from "./value-editor";

export function FilterRow({
  draft,
  fields,
  models,
  error,
  onChange,
  onRemove,
}: {
  draft: Draft;
  fields: ApiField[];
  models: string[];
  error?: string;
  onChange: (d: Draft) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.name === draft.field);
  return (
    <div className="grid grid-cols-[minmax(160px,1fr)_minmax(150px,190px)_2fr_auto] items-start gap-2">
      <FieldPicker fields={fields} value={draft.field} onChange={(f) => onChange({ ...newDraft(f), id: draft.id })} />
      <Select value={draft.op} onValueChange={(op) => field && onChange(withOp(draft, field, op as Op))}>
        <SelectTrigger className="w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(field?.ops ?? []).map((op) => (
            <SelectItem key={op} value={op} className="text-xs">
              {OP_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-1">
        {field && <ValueEditor field={field} op={draft.op} models={models} value={draft.value} onChange={(value) => onChange({ ...draft, value })} />}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove filter">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

/** Searchable field picker showing type and description, driven by the schema. */
function FieldPicker({ fields, value, onChange }: { fields: ApiField[]; value: string; onChange: (f: ApiField) => void }) {
  const [open, setOpen] = React.useState(false);
  const current = fields.find((f) => f.name === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-mono text-xs font-normal">
          <span className="truncate">{current?.name ?? "Field"}</span>
          {current && <span className="ml-2 text-muted-foreground">{current.type}</span>}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList>
            <CommandEmpty>No fields.</CommandEmpty>
            <CommandGroup>
              {fields.map((f) => (
                <CommandItem
                  key={f.name}
                  value={`${f.name} ${f.description ?? ""}`}
                  onSelect={() => {
                    onChange(f);
                    setOpen(false);
                  }}
                  className="flex-col items-start gap-0.5"
                >
                  <div className="flex w-full items-center gap-2 font-mono text-xs">
                    {f.name}
                    <span className="ml-auto text-muted-foreground">{f.type}</span>
                  </div>
                  {f.description && <span className="text-xs text-muted-foreground">{f.description}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
