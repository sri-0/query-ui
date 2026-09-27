"use client";

import { ModelSelect } from "@/components/query/model-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { schemaOptions } from "@/lib/api/query-options";
import { fromFilter, newDraft, toFilter, validateDraft, type Draft } from "@/lib/schema/builder";
import { emptyQueryState, type QueryMode, type QueryTabState } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import { Play, Plus } from "lucide-react";
import { MODE_META, MODE_ORDER } from "@/components/query/modes";
import * as React from "react";
import { FilterRow } from "./filter-row";


/**
 * The query composer: pick models, author the query in one of four modes and
 * run it. Used both for a brand-new query and to edit an existing tab.
 */
export function QueryComposer({
  open,
  onOpenChange,
  initial,
  onRun,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: QueryTabState;
  onRun: (state: QueryTabState) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-4xl">
        {/* keyed on open so every opening starts from `initial` */}
        {open && <ComposerBody key={initial ? "edit" : "new"} initial={initial ?? emptyQueryState()} onRun={onRun} />}
      </DialogContent>
    </Dialog>
  );
}

function ComposerBody({ initial, onRun }: { initial: QueryTabState; onRun: (s: QueryTabState) => void }) {
  const [models, setModels] = React.useState(initial.models);
  const [mode, setMode] = React.useState<QueryMode>(initial.mode);
  const [lucene, setLucene] = React.useState(initial.lucene);
  const [text, setText] = React.useState(initial.text);
  const [semantic, setSemantic] = React.useState(initial.semantic);
  const { data: schema, isLoading } = useQuery(schemaOptions(models));
  const fields = React.useMemo(() => (schema?.fields ?? []).filter((f) => f.type !== "vector" && !f.conflict && f.ops.length > 0), [schema]);
  const byName = React.useMemo(() => new Map(fields.map((f) => [f.name, f])), [fields]);

  const [drafts, setDrafts] = React.useState<Draft[] | null>(null);
  // Drafts need the schema to be revived from filters; do it once it arrives.
  const rows = React.useMemo<Draft[]>(() => {
    if (drafts) return drafts;
    if (!schema) return [];
    return initial.advanced.flatMap((f) => {
      const field = byName.get(f.field);
      return field ? [fromFilter(f, field)] : [];
    });
  }, [drafts, schema, initial.advanced, byName]);
  const setRows = (next: Draft[]) => setDrafts(next);

  const errors = rows.map((d) => validateDraft(d, byName.get(d.field)));
  const builderValid = errors.every((e) => !e);
  const canRun =
    mode === "builder" ? builderValid : mode === "lucene" ? !!lucene.trim() : mode === "text" ? !!text.trim() : !!semantic.trim();

  const run = () => {
    const advanced = rows.flatMap((d) => {
      const field = byName.get(d.field);
      return field ? [toFilter(d, field)] : [];
    });
    onRun({
      ...initial,
      models,
      mode,
      advanced: mode === "builder" ? advanced : initial.advanced,
      lucene: mode === "lucene" ? lucene.trim() : initial.lucene,
      text: mode === "text" ? text.trim() : initial.text,
      semantic: mode === "semantic" ? semantic.trim() : initial.semantic,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Compose query</DialogTitle>
        <DialogDescription>Pick the models, choose how to author the query, then run it.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Models</Label>
        <ModelSelect value={models} onChange={setModels} />
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as QueryMode)}>
        <TabsList className="grid w-full grid-cols-4">
          {MODE_ORDER.map((m) => {
            const Icon = MODE_META[m].icon;
            return (
              <TabsTrigger key={m} value={m} className="gap-1.5">
                <Icon className="size-3.5" /> {MODE_META[m].label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="builder" className="mt-3 flex flex-col gap-2">
          {isLoading && <Skeleton className="h-9 w-full" />}
          {rows.map((d, i) => (
            <FilterRow
              key={d.id}
              draft={d}
              fields={fields}
              models={models}
              error={errors[i]}
              onChange={(next) => setRows(rows.map((r) => (r.id === d.id ? next : r)))}
              onRemove={() => setRows(rows.filter((r) => r.id !== d.id))}
            />
          ))}
          {!isLoading && rows.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No filters yet. Run as-is to browse everything, or add a filter.
            </p>
          )}
          <Button variant="outline" size="sm" className="self-start" disabled={!fields.length} onClick={() => setRows([...rows, newDraft(fields[0])])}>
            <Plus className="size-4" /> Add filter
          </Button>
        </TabsContent>

        <TabsContent value="lucene" className="mt-3">
          <ModeField label="Lucene query" hint="query_string syntax, e.g. status:[500 TO 599] AND host:web-0* NOT level:debug">
            <Input value={lucene} onChange={(e) => setLucene(e.target.value)} className="font-mono text-sm" placeholder="status:>=500 AND host:web-*" />
          </ModeField>
        </TabsContent>
        <TabsContent value="text" className="mt-3">
          <ModeField label="Full-text search" hint={`Matches across text fields: ${fields.filter((f) => f.searchable).map((f) => f.name).join(", ") || "none"}`}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="login failure" />
          </ModeField>
        </TabsContent>
        <TabsContent value="semantic" className="mt-3">
          <ModeField label="Semantic search" hint="Embeds your description and finds the nearest documents.">
            <Textarea value={semantic} onChange={(e) => setSemantic(e.target.value)} rows={3} placeholder="users locked out after repeated failed logins" />
          </ModeField>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button disabled={!canRun} onClick={run}>
          <Play className="size-4" /> Run query
        </Button>
      </DialogFooter>
    </>
  );
}

function ModeField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

