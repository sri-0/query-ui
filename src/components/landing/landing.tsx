"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { modelsOptions } from "@/lib/api/query-options";
import type { ModelInfo } from "@/lib/api/types";
import { useTabs } from "@/lib/store/tabs";
import { useUi } from "@/lib/store/ui";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Database, Plus } from "lucide-react";
import * as React from "react";
import { RecentQueries } from "./recent-queries";

/** How many models to show before the list collapses behind "Show all". */
const MODEL_PREVIEW = 5;

export function Landing() {
  const openComposer = useUi((s) => s.openComposer);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Query</h1>
            <p className="text-sm text-muted-foreground">Start from a model, a recent query, or ask the assistant.</p>
          </div>
          <Button onClick={() => openComposer()}>
            <Plus className="size-4" /> New query
          </Button>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Models</h2>
          <Models />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Recent queries</h2>
          <RecentQueries />
        </section>
      </div>
    </ScrollArea>
  );
}

/** Largest models first; the rest expand on demand so hundreds of models stay tidy. */
function Models() {
  const { data, isLoading, error } = useQuery(modelsOptions());
  const openQuery = useTabs((s) => s.openQuery);
  const [expanded, setExpanded] = React.useState(false);

  if (error) return <p className="text-sm text-destructive">Could not load models: {error.message}</p>;
  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }
  const sorted = [...data.models].sort((a, b) => b.docCount - a.docCount);
  const shown = expanded ? sorted : sorted.slice(0, MODEL_PREVIEW);
  const hidden = sorted.length - shown.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <ModelCard key={m.name} model={m} onOpen={() => openQuery({ models: [m.name] })} />
        ))}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => openQuery({ models: [] })}
          onKeyDown={(e) => e.key === "Enter" && openQuery({ models: [] })}
          className="cursor-pointer border-dashed transition-colors hover:bg-accent/40"
        >
          <CardHeader>
            <CardTitle className="text-sm">All models</CardTitle>
            <CardDescription>Browse every model at once. Rows carry a model badge.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      {sorted.length > MODEL_PREVIEW && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {expanded ? "Show fewer" : `Show all ${sorted.length} models (${hidden} more)`}
        </Button>
      )}
    </div>
  );
}

function ModelCard({ model: m, onOpen }: { model: ModelInfo; onOpen: () => void }) {
  return (
    <Card role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()} className="cursor-pointer transition-colors hover:bg-accent/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono text-sm">
          <Database className="size-4 text-muted-foreground" /> {m.name}
        </CardTitle>
        <CardDescription>{m.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{m.docCount.toLocaleString()} docs</Badge>
        {m.timeField && <span>time: {m.timeField}</span>}
      </CardContent>
    </Card>
  );
}
