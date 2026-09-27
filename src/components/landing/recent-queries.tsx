"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { recentQueriesOptions } from "@/lib/api/query-options";
import type { SavedQuery } from "@/lib/api/types";
import { useTabs } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Play } from "lucide-react";

export function RecentQueries() {
  const { data, isLoading, error } = useQuery(recentQueriesOptions(30));
  const openQuery = useTabs((s) => s.openQuery);

  const reopen = (q: SavedQuery) => {
    const r = q.request;
    openQuery({
      title: titleFor(q),
      models: r.indices ?? q.indices,
      lucene: r.lucene ?? "",
      text: r.text ?? "",
      semantic: r.semantic?.text ?? "",
      advanced: r.filters ?? [],
    });
  };

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (error) return <p className="text-sm text-destructive">Could not load recent queries: {error.message}</p>;
  if (!data?.queries.length)
    return <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No queries yet. Run one and it will appear here.</p>;

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead>Models</TableHead>
            <TableHead className="text-right">Results</TableHead>
            <TableHead className="text-right">Took</TableHead>
            <TableHead>When</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.queries.map((q) => (
            <TableRow key={q.id} className="cursor-pointer" onClick={() => reopen(q)}>
              <TableCell className="max-w-md truncate font-mono text-xs">{titleFor(q)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {q.indices.map((m) => (
                    <Badge key={m} variant="outline" className="font-mono text-[10px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{q.resultCount.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{q.tookMs} ms</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" className="size-7" aria-label="Open">
                  <Play className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function titleFor(q: SavedQuery) {
  if (q.lucene) return q.lucene;
  if (q.semantic) return `~ ${q.semantic}`;
  if (q.text) return `"${q.text}"`;
  const f = q.request.filters ?? [];
  if (f.length) return f.map((x) => `${x.field}:${x.op}${x.value !== undefined ? ` ${JSON.stringify(x.value)}` : ""}`).join("  ");
  return "match all";
}
