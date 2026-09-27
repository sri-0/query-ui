"use client";

import { useControls } from "@/components/controls";
import { DataTableFilterCommand } from "@/components/data-table/data-table-filter-command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDraftValue } from "@/hooks/use-draft-value";
import { useHotKey } from "@/hooks/use-hot-key";
import type { SchemaResponse } from "@/lib/api/types";
import { describeFilter } from "@/lib/schema/builder";
import type { SchemaDefinition } from "@/lib/store/schema";
import { useTabs, type QueryMode, type QueryTab } from "@/lib/store/tabs";
import { useUi } from "@/lib/store/ui";
import { ListFilter, PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from "lucide-react";
import { Chip } from "./chip";
import { CommitInput } from "./commit-input";
import { LuceneBar } from "./lucene-bar";
import { MODE_META, MODE_ORDER } from "./modes";

/** Input modes: the column-filter command bar plus the non-builder query modes. */
type InputMode = "filter" | Exclude<QueryMode, "builder">;

/** The builder has no inline input; its filters show as chips and open the composer. */
function toInputMode(mode: QueryMode): InputMode {
  return mode === "builder" ? "filter" : mode;
}

/**
 * The single query input row above the table: a segmented mode switch, the
 * input for that mode, the filters-panel toggle and the builder.
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
  const openComposer = useUi((s) => s.openComposer);
  const { open: filtersOpen, setOpen: setFiltersOpen } = useControls();
  useHotKey(() => setFiltersOpen((v) => !v), "b");
  const [mode, setMode] = useDraftValue<InputMode>(toInputMode(tab.mode));
  const hasVector = schema.fields.some((f) => f.type === "vector" && !f.conflict);
  const modes: InputMode[] = ["filter", ...MODE_ORDER.filter((m): m is Exclude<QueryMode, "builder"> => m !== "builder" && (m !== "semantic" || hasVector))];

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...(mode !== "lucene" && tab.lucene ? [{ key: "lucene", label: `lucene: ${tab.lucene}`, onRemove: () => updateQuery(tab.id, { lucene: "" }) }] : []),
    ...(mode !== "text" && tab.text ? [{ key: "text", label: `text: ${tab.text}`, onRemove: () => updateQuery(tab.id, { text: "" }) }] : []),
    ...(mode !== "semantic" && tab.semantic ? [{ key: "semantic", label: `semantic: ${tab.semantic}`, onRemove: () => updateQuery(tab.id, { semantic: "" }) }] : []),
    ...tab.advanced.map((f, i) => ({
      key: `adv-${i}-${f.field}`,
      label: describeFilter(f),
      onRemove: () => updateQuery(tab.id, (t) => ({ advanced: t.advanced.filter((_, j) => j !== i) })),
    })),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-9 items-stretch gap-2 [&_input]:h-9">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setFiltersOpen((v) => !v)} aria-label={filtersOpen ? "Hide filters" : "Show filters"}>
              {filtersOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{filtersOpen ? "Hide filters panel (⌘B)" : "Show filters panel (⌘B)"}</TooltipContent>
        </Tooltip>
        <ToggleGroup type="single" variant="outline" spacing={0} value={mode} onValueChange={(v) => v && setMode(v as InputMode)} className="h-9 shrink-0 *:h-9 *:px-2.5">
          {modes.map((m) => {
            const meta = m === "filter" ? { icon: ListFilter, description: "Column filters (field:value)" } : MODE_META[m];
            return (
              <Tooltip key={m}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={m} aria-label={meta.description} className="aria-checked:bg-muted-foreground/25! aria-checked:text-foreground!">
                    <meta.icon className="size-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{meta.description}</TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroup>

        <div className="min-w-0 flex-1">
          {mode === "filter" && <DataTableFilterCommand schema={filterSchema} tableId={tab.id} />}
          {mode === "lucene" && (
            <LuceneBar schema={schema} models={tab.models} value={tab.lucene} onCommit={(lucene) => updateQuery(tab.id, { lucene, mode: "lucene" })} />
          )}
          {mode === "text" && (
            <CommitInput placeholder="Search text fields, e.g. login failure" value={tab.text} onCommit={(text) => updateQuery(tab.id, { text, mode: "text" })} />
          )}
          {mode === "semantic" && (
            <CommitInput
              placeholder="Describe what you are looking for, e.g. users locked out after failed attempts"
              value={tab.semantic}
              onCommit={(semantic) => updateQuery(tab.id, { semantic, mode: "semantic" })}
            />
          )}
        </div>

        <Button variant="outline" className="h-9 shrink-0" onClick={() => openComposer(tab.id)}>
          <SlidersHorizontal className="size-4" /> Builder
          {tab.advanced.length > 0 && <Badge variant="secondary">{tab.advanced.length}</Badge>}
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
