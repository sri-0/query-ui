"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { modelsOptions } from "@/lib/api/query-options";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";

/** Searchable multi-select of models. Empty selection means "all models". */
export function ModelSelect({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (models: string[]) => void;
  className?: string;
}) {
  const { data } = useQuery(modelsOptions());
  const [open, setOpen] = React.useState(false);
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((m) => m !== name) : [...value, name]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("h-auto min-h-9 w-full justify-between", className)}>
          <div className="flex flex-wrap gap-1">
            {value.length === 0 && <span className="text-muted-foreground">All models</span>}
            {value.map((m) => (
              <Badge key={m} variant="secondary" className="gap-1 font-mono text-[11px]">
                {m}
                <span
                  role="button"
                  aria-label={`Remove ${m}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(m);
                  }}
                  className="rounded-sm hover:text-foreground"
                >
                  <X className="size-3" />
                </span>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              {data?.models.map((m) => {
                const selected = value.includes(m.name);
                return (
                  <CommandItem key={m.name} value={m.name} onSelect={() => toggle(m.name)}>
                    <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
                    <span className="font-mono text-xs">{m.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{m.docCount.toLocaleString()}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={() => onChange([])} className="text-muted-foreground">
                  Clear selection (all models)
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
