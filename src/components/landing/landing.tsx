"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { modelsOptions } from "@/lib/api/query-options";
import { useTabs } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import { Database, Plus } from "lucide-react";
import * as React from "react";
import { NewQueryDialog } from "./new-query-dialog";
import { RecentQueries } from "./recent-queries";

export function Landing() {
  const { data, isLoading, error } = useQuery(modelsOptions());
  const openQuery = useTabs((s) => s.openQuery);
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Query</h1>
            <p className="text-sm text-muted-foreground">
              Start from a model, a saved query, or ask the assistant.
            </p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="size-4" /> New query
          </Button>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Models</h2>
          {error && <p className="text-sm text-destructive">Could not load models: {error.message}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            {data?.models.map((m) => (
              <Card
                key={m.name}
                role="button"
                tabIndex={0}
                onClick={() => openQuery({ models: [m.name] })}
                onKeyDown={(e) => e.key === "Enter" && openQuery({ models: [m.name] })}
                className="cursor-pointer transition-colors hover:bg-accent/40"
              >
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
            ))}
            {data && (
              <Card
                role="button"
                tabIndex={0}
                onClick={() => openQuery({ models: [] })}
                onKeyDown={(e) => e.key === "Enter" && openQuery({ models: [] })}
                className="cursor-pointer border-dashed transition-colors hover:bg-accent/40"
              >
                <CardHeader>
                  <CardTitle className="text-sm">All models</CardTitle>
                  <CardDescription>Search across every model at once. Rows carry a model badge.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Recent queries</h2>
          <RecentQueries />
        </section>
      </div>
      <NewQueryDialog open={newOpen} onOpenChange={setNewOpen} />
    </ScrollArea>
  );
}
