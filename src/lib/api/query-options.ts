import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "./client";
import type { QueryRequest, ValuesRequest } from "./types";

export const modelsOptions = () =>
  queryOptions({ queryKey: ["models"], queryFn: ({ signal }) => api.models(signal), staleTime: 60_000 });

export const schemaOptions = (models: string[]) =>
  queryOptions({
    queryKey: ["schema", [...models].sort()],
    queryFn: ({ signal }) => api.schema(models, signal),
    staleTime: 5 * 60_000,
  });

export const recentQueriesOptions = (limit = 50) =>
  queryOptions({
    queryKey: ["queries", limit],
    queryFn: ({ signal }) => api.queries({ limit }, signal),
    staleTime: 10_000,
  });

export const valuesOptions = (body: ValuesRequest, enabled = true) =>
  queryOptions({
    queryKey: ["values", body],
    queryFn: ({ signal }) => api.values(body, signal),
    staleTime: 30_000,
    enabled,
  });

/**
 * Infinite search. The first page carries meta (counts, chart, facets);
 * later pages send `meta: false` and only fetch rows after the cursor.
 */
export const searchOptions = (body: Omit<QueryRequest, "cursor" | "meta">) =>
  infiniteQueryOptions({
    queryKey: ["search", body],
    queryFn: ({ pageParam, signal }) =>
      api.query(pageParam ? { ...body, cursor: pageParam, meta: false } : { ...body, meta: true }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
