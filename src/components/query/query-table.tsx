"use client";

import { TimelineChart, type TimelineChartSeries } from "@/components/data-table/data-table-chart/timeline-chart";
import { DataTableInfinite } from "@/components/data-table/data-table-infinite";
import { useDataTable } from "@/components/data-table/data-table-provider";
import { DataTableRefreshButton } from "@/components/data-table/data-table-refresh-button";
import { MemoizedDataTableSheetContent } from "@/components/data-table/data-table-sheet/data-table-sheet-content";
import { DataTableSheetDetails } from "@/components/data-table/data-table-sheet/data-table-sheet-details";
import type { SheetField } from "@/components/data-table/types";
import { searchOptions } from "@/lib/api/query-options";
import type { QueryMeta, Row, SchemaResponse } from "@/lib/api/types";
import { applyFacets, getFacetedMinMaxValues, getFacetedUniqueValues } from "@/lib/data-table";
import { isActive } from "@/lib/filters";
import { buildRequest, STATE_KEYS } from "@/lib/schema/filter-mapping";
import { MODEL_COLUMN } from "@/lib/schema/to-table-schema";
import { useFilterState } from "@/lib/store/hooks/useFilterState";
import type { SchemaDefinition } from "@/lib/store/schema";
import type { QueryTab } from "@/lib/store/tabs";
import { generateColumns, generateFilterFields, generateSheetFields, getDefaultColumnVisibility } from "@/lib/table-schema";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { QueryFooter } from "./query-footer";
import { QueryInputs } from "./query-inputs";
import { AiPanel } from "@/components/shell/ai-panel";
import { useUi } from "@/lib/store/ui";

const MODEL_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const SERIES_COLORS: Record<string, string> = {
  debug: "var(--muted-foreground)",
  info: "var(--info)",
  warn: "var(--warning)",
  error: "var(--error)",
  low: "var(--info)",
  medium: "var(--warning)",
  high: "var(--error)",
  critical: "var(--destructive)",
  total: "var(--chart-1)",
};

type Props = {
  tab: QueryTab;
  schema: SchemaResponse;
  tableSchema: { definition: Parameters<typeof generateColumns>[0] };
  filterSchema: { definition: SchemaDefinition };
  active: boolean;
};

export function QueryTable({ tab, schema, tableSchema, filterSchema, active }: Props) {
  const columns = React.useMemo(() => generateColumns<Row>(tableSchema.definition), [tableSchema]);
  const filterFields = React.useMemo(() => generateFilterFields<Row>(tableSchema.definition), [tableSchema]);
  const sheetFields = React.useMemo(() => generateSheetFields<Row>(tableSchema.definition), [tableSchema]);
  const defaultVisibility = React.useMemo(() => getDefaultColumnVisibility(tableSchema.definition), [tableSchema]);

  const state = useFilterState<Record<string, unknown>>();
  const aiOpen = useUi((s) => s.aiOpen);
  const body = React.useMemo(() => buildRequest(tab, schema, state), [tab, schema, state]);
  const options = React.useMemo(() => searchOptions(body), [body]);
  const queryClient = useQueryClient();
  const { data, isFetching, isLoading, fetchNextPage, hasNextPage, error } = useInfiniteQuery({
    ...options,
    enabled: active || !!queryClient.getQueryData(options.queryKey),
  });

  const geoFields = React.useMemo(() => schema.fields.filter((f) => f.type === "geo_point").map((f) => f.name), [schema]);
  const rows = React.useMemo(() => (data?.pages.flatMap((p) => p.data) ?? []).map((r) => flattenGeo(r, geoFields)), [data?.pages, geoFields]);
  const meta: QueryMeta | undefined = data?.pages[0]?.meta;
  // data-table facets require `rows`; stats-only facets (numbers) have none.
  const facets = React.useMemo(() => normalizeFacets(meta), [meta]);

  // Only fields the currently searched models can filter on.
  const activeModels = React.useMemo(() => body.indices ?? [], [body.indices]);
  const fieldModels = React.useMemo(() => new Map(schema.fields.map((f) => [f.name, f.models])), [schema]);
  const dynamicFilterFields = React.useMemo(
    () =>
      applyFacets(
        filterFields.filter((f) => {
          const models = fieldModels.get(String(f.value));
          return !models || models.some((m) => activeModels.includes(m));
        }),
        facets,
      ),
    [filterFields, facets, fieldModels, activeModels],
  );
  const defaultColumnFilters = Object.entries(state)
    .filter(([k, v]) => !STATE_KEYS.has(k) && isActive(v))
    .map(([id, value]) => ({ id, value }));
  const sort = state.sort as { id: string; desc: boolean } | null | undefined;

  const series = React.useMemo<TimelineChartSeries[]>(() => {
    const keys = meta?.chartSeries ?? ["total"];
    const isModel = body.histogram?.series === MODEL_COLUMN;
    return keys.map((k, i) => ({ key: k, label: k, color: isModel ? MODEL_COLORS[i % MODEL_COLORS.length] : SERIES_COLORS[k] ?? MODEL_COLORS[i % MODEL_COLORS.length] }));
  }, [meta?.chartSeries, body.histogram?.series]);

  const refresh = React.useCallback(() => queryClient.resetQueries({ queryKey: options.queryKey, exact: true }), [queryClient, options.queryKey]);

  return (
    <div className="h-full min-h-0">
        <DataTableInfinite<Row>
          columns={columns}
          data={rows}
          totalRows={meta?.totalRowCount}
          filterRows={meta?.filterRowCount}
          totalRowsFetched={rows.length}
          defaultColumnFilters={defaultColumnFilters}
          defaultColumnSorting={sort ? [sort] : undefined}
          defaultRowSelection={state.uuid ? { [String(state.uuid)]: true } : undefined}
          defaultColumnVisibility={defaultVisibility}
          filterFields={dynamicFilterFields}
          isFetching={isFetching}
          isLoading={isLoading}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          getRowId={(row) => `${row._model}:${row._id}`}
          getFacetedUniqueValues={getFacetedUniqueValues(facets)}
          getFacetedMinMaxValues={getFacetedMinMaxValues(facets)}
          chartSlot={
            schema.timeField ? (
              <TimelineChart data={meta?.chartData ?? []} columnId={schema.timeField} series={series} className="-mb-2" />
            ) : undefined
          }
          toolbarActions={<DataTableRefreshButton onClick={refresh} />}
          footerSlot={<QueryFooter meta={meta} />}
          commandSlot={<QueryInputs tab={tab} schema={schema} filterSchema={filterSchema.definition} error={error ?? undefined} />}
          sideSlot={aiOpen ? <AiPanel models={body.indices ?? []} /> : undefined}
          sheetSlot={<SheetSlot sheetFields={sheetFields} meta={meta} fetched={rows.length} />}
          tableId={tab.id}
        />
    </div>
  );
}

function SheetSlot({ sheetFields, meta, fetched }: { sheetFields: SheetField<Row>[]; meta?: QueryMeta; fetched: number }) {
  const { table, rowSelection, isLoading, filterFields } = useDataTable<Row, unknown>();
  const key = Object.keys(rowSelection)[0];
  const selected = React.useMemo(() => {
    if (isLoading && !key) return undefined;
    return table.getCoreRowModel().flatRows.find((r) => r.id === key);
  }, [key, isLoading, table]);
  return (
    <DataTableSheetDetails title={selected ? `${selected.original._model} · ${selected.original._id}` : undefined} titleClassName="font-mono">
      <MemoizedDataTableSheetContent
        table={table}
        data={selected?.original}
        filterFields={filterFields}
        fields={sheetFields}
        metadata={{ totalRows: meta?.totalRowCount ?? 0, filterRows: meta?.filterRowCount ?? 0, totalRowsFetched: fetched }}
      />
    </DataTableSheetDetails>
  );
}

function normalizeFacets(meta?: QueryMeta) {
  if (!meta?.facets) return undefined;
  return Object.fromEntries(Object.entries(meta.facets).map(([k, f]) => [k, { ...f, rows: f.rows ?? [] }]));
}

/** Geo points arrive as `{lat, lon}`; cells and the row sheet render strings, so flatten them. */
function flattenGeo(row: Row, fields: string[]): Row {
  if (fields.length === 0) return row;
  let out = row;
  for (const f of fields) {
    const v = row[f];
    if (v && typeof v === "object" && "lat" in v && "lon" in v) {
      const g = v as { lat: number; lon: number };
      if (out === row) out = { ...row };
      out[f] = `${g.lat.toFixed(4)}, ${g.lon.toFixed(4)}`;
    }
  }
  return out;
}
