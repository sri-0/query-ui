"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { schemaOptions } from "@/lib/api/query-options";
import type { SchemaResponse } from "@/lib/api/types";
import { generateFilterSchema } from "@/lib/table-schema";
import { reviveState, serializeState } from "@/lib/schema/filter-mapping";
import { toTableSchema, widenFilterSchema } from "@/lib/schema/to-table-schema";
import { useTabAdapter } from "@/lib/store/adapters/tab";
import { DataTableStoreProvider } from "@/lib/store/provider/DataTableStoreProvider";
import { createSchema, field } from "@/lib/store/schema";
import { useTabs, type QueryTab } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import * as React from "react";
import { QueryTable } from "./query-table";

/**
 * One query tab: loads the schema for its models, derives the table schema
 * from it and mounts an isolated store so several tabs can coexist.
 */
export function QueryTabView({ tab, active }: { tab: QueryTab; active: boolean }) {
  const { data: schema, isLoading, error } = useQuery(schemaOptions(tab.models));
  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="flex-1" />
      </div>
    );
  }
  if (error || !schema) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load schema</AlertTitle>
          <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
        </Alert>
      </div>
    );
  }
  return <Loaded tab={tab} schema={schema} active={active} />;
}

function Loaded({ tab, schema, active }: { tab: QueryTab; schema: SchemaResponse; active: boolean }) {
  const updateQuery = useTabs((s) => s.updateQuery);
  const tableSchema = React.useMemo(() => toTableSchema(schema), [schema]);
  const filterSchema = React.useMemo(() => {
    const generated = generateFilterSchema(tableSchema.definition, { sort: field.sort(), uuid: field.string() });
    return createSchema(widenFilterSchema(generated.definition, schema));
  }, [tableSchema, schema]);
  const initialState = React.useMemo(() => reviveState(tab.filters, schema), [schema]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = React.useCallback(
    (state: Record<string, unknown>) => updateQuery(tab.id, { filters: serializeState(state) }),
    [tab.id, updateQuery],
  );
  const adapter = useTabAdapter(filterSchema.definition, { id: tab.id, initialState, onChange });

  return (
    <DataTableStoreProvider adapter={adapter}>
      <QueryTable tab={tab} schema={schema} tableSchema={tableSchema} filterSchema={filterSchema} active={active} />
    </DataTableStoreProvider>
  );
}
