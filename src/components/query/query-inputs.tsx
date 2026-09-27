"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Filter, SchemaResponse } from "@/lib/api/types";
import { useTabs, type QueryTab } from "@/lib/store/tabs";
import { ListFilter, Search, SlidersHorizontal, Sparkles, Terminal, X } from "lucide-react";
import { DataTableFilterCommand } from "@/components/data-table/data-table-filter-command";
import type { SchemaDefinition } from "@/lib/store/schema";
import * as React from "react";
import { LuceneBar } from "./lucene-bar";
import { QueryBuilder } from "./query-builder";

type Mode = "filter" | "lucene" | "text" | "semantic";

/**
 * The query entry row above the table: a mode switch between Lucene, full-text
 * and semantic search, the builder, and chips for builder filters.
 */
export function QueryInputs({
  tab,
  schema,
  filterSchema,
  error,
}: {
  tab: QueryTab;
  schema: SchemaResponse;
  filterSchema: SchemaDefinition;
  error?: Error;
}) {
  const updateQuery = useTabs((s) => s.updateQuery);
  const [mode, setMode] = React.useState<Mode>(tab.semantic ? "semantic" : tab.text ? "text" : tab.lucene ? "lucene" : "filter");
  const [builderOpen, setBuilderOpen] = React.useState(!!tab.openBuilder);
  React.useEffect(() => {
    if (tab.openBuilder) updateQuery(tab.id, { openBuilder: false });
  }, [tab.id, tab.openBuilder, updateQuery]);

  const hasVector = schema.fields.some((f) => f.type === "vector" && !f.conflict);
  const removeAdvanced = (i: number) =>
    updateQuery(tab.id, (t) => ({ advanced: t.advanced.filter((_, j) => j !== i) }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as Mode)}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="filter" aria-label="Filters">
                <ListFilter className="size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Column filters (field:value)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="lucene" aria-label="Lucene">
                <Terminal className="size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Lucene query syntax</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="text" aria-label="Full text">
                <Search className="size-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Full-text search across text fields</TooltipContent>
          </Tooltip>
          {hasVector && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="semantic" aria-label="Semantic">
                  <Sparkles className="size-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Semantic (vector) search</TooltipContent>
            </Tooltip>
          )}
        </ToggleGroup>

        <div className="min-w-0 flex-1">
          {mode === "filter" && <DataTableFilterCommand schema={filterSchema} tableId={tab.id} />}
          {mode === "lucene" && (
            <LuceneBar
              schema={schema}
              models={tab.models}
              value={tab.lucene}
              onCommit={(lucene) => updateQuery(tab.id, { lucene })}
            />
          )}
          {mode === "text" && (
            <CommitInput
              placeholder="Search text fields, e.g. login failure"
              value={tab.text}
              onCommit={(text) => updateQuery(tab.id, { text })}
            />
          )}
          {mode === "semantic" && (
            <CommitInput
              placeholder="Describe what you are looking for, e.g. users locked out after failed attempts"
              value={tab.semantic}
              onCommit={(semantic) => updateQuery(tab.id, { semantic })}
            />
          )}
        </div>

        <Button variant="outline" size="sm" onClick={() => setBuilderOpen(true)}>
          <SlidersHorizontal className="size-4" /> Builder
          {tab.advanced.length > 0 && <Badge variant="secondary">{tab.advanced.length}</Badge>}
        </Button>
      </div>

      {(tab.advanced.length > 0 || (mode !== "lucene" && tab.lucene) || (mode !== "text" && tab.text) || (mode !== "semantic" && tab.semantic)) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {mode !== "lucene" && tab.lucene && (
            <Chip label={`lucene: ${tab.lucene}`} onRemove={() => updateQuery(tab.id, { lucene: "" })} />
          )}
          {mode !== "text" && tab.text && <Chip label={`text: ${tab.text}`} onRemove={() => updateQuery(tab.id, { text: "" })} />}
          {mode !== "semantic" && tab.semantic && (
            <Chip label={`semantic: ${tab.semantic}`} onRemove={() => updateQuery(tab.id, { semantic: "" })} />
          )}
          {tab.advanced.map((f, i) => (
            <Chip key={i} label={describe(f)} onRemove={() => removeAdvanced(i)} />
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}

      <QueryBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        schema={schema}
        models={tab.models}
        onModelsChange={(models) => updateQuery(tab.id, { models, filters: {} })}
        filters={tab.advanced}
        onApply={(advanced) => updateQuery(tab.id, { advanced })}
      />
    </div>
  );
}

function CommitInput({ value, onCommit, placeholder }: { value: string; onCommit: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = React.useState(value);
  const [seen, setSeen] = React.useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  return (
    <Input
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(draft);
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="max-w-full gap-1 font-mono text-[11px]">
      <span className="truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label="Remove" className="rounded-sm hover:text-foreground">
        <X className="size-3" />
      </button>
    </Badge>
  );
}

export function describe(f: Filter) {
  if (f.value === undefined) return `${f.field} ${f.op}`;
  return `${f.field} ${f.op} ${typeof f.value === "string" ? f.value : JSON.stringify(f.value)}`;
}
