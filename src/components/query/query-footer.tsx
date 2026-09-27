"use client";

import type { QueryMeta } from "@/lib/api/types";

export function QueryFooter({ meta }: { meta?: QueryMeta }) {
  if (!meta) return null;
  const rel = meta.filterRowCountRelation === "gte" ? "+" : "";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>
        {meta.filterRowCount.toLocaleString()}
        {rel} of {meta.totalRowCount.toLocaleString()} rows
      </span>
      <span>{meta.tookMs} ms</span>
      {meta.modelCounts &&
        Object.entries(meta.modelCounts).map(([m, n]) => (
          <span key={m} className="font-mono">
            {m}: {n.toLocaleString()}
          </span>
        ))}
      {meta.queryId && <span className="font-mono">id {meta.queryId}</span>}
    </div>
  );
}
