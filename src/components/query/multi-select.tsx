"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Chip } from "./chip";
import * as React from "react";

type MultiSelectOption = { value: string; label?: string; hint?: string };

/**
 * Searchable multi-select combobox rendered as badges. Shared by the model
 * picker and the builder's enum/keyword editors.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  emptyLabel = "All",
  searchPlaceholder = "Search...",
  onSearch,
  loading,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  /** Shown when nothing is selected. */
  emptyLabel?: string;
  searchPlaceholder?: string;
  /** When set, the search box is server-driven and local filtering is disabled. */
  onSearch?: (q: string) => void;
  loading?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn("h-auto min-h-9 w-full justify-between font-normal", className)}
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 && <span className="text-muted-foreground">{emptyLabel}</span>}
            {value.map((v) => (
              <Chip key={v} label={labelOf(v)} onRemove={() => toggle(v)} removeAs="span" />
            ))}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput placeholder={searchPlaceholder} onValueChange={onSearch} />
          <CommandList>
            <CommandEmpty>{loading ? "Loading..." : "No options."}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const selected = value.includes(o.value);
                return (
                  <CommandItem key={o.value} value={o.value} onSelect={() => toggle(o.value)}>
                    <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
                    <span className="font-mono text-xs">{o.label ?? o.value}</span>
                    {o.hint && <span className="ml-auto text-xs text-muted-foreground">{o.hint}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={() => onChange([])} className="text-muted-foreground">
                  Clear selection
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
