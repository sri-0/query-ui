import type {
  ModelInfo,
  QueryMeta,
  QueryRequest,
  QueryResponse,
  SavedQuery,
  SchemaResponse,
  ValidateResponse,
  ValuesRequest,
  ValuesResponse,
} from "./types";

/** The UI is a pure client app: it talks to the query API directly (CORS). */
const BASE = `${process.env.NEXT_PUBLIC_QUERY_API_URL ?? "http://localhost:8080"}/v1`;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let body: { error?: string; details?: unknown } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, body.error ?? res.statusText, body.details);
  }
  return (await res.json()) as T;
}

function post<T>(path: string, body: unknown, signal?: AbortSignal) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), signal });
}

export const api = {
  models: (signal?: AbortSignal) => request<{ models: ModelInfo[] }>("/models", { signal }),
  schema: (models: string[], signal?: AbortSignal) =>
    request<SchemaResponse>(`/schema${models.length ? `?models=${models.join(",")}` : ""}`, { signal }),
  query: (body: QueryRequest, signal?: AbortSignal) => post<QueryResponse>("/search/query", body, signal),
  aggregate: (body: QueryRequest, signal?: AbortSignal) =>
    post<{ meta: QueryMeta }>("/search/aggregate", body, signal),
  values: (body: ValuesRequest, signal?: AbortSignal) => post<ValuesResponse>("/search/values", body, signal),
  autocomplete: (body: ValuesRequest, signal?: AbortSignal) =>
    post<ValuesResponse>("/search/autocomplete", body, signal),
  validate: (body: { indices?: string[]; lucene: string }, signal?: AbortSignal) =>
    post<ValidateResponse>("/search/validate", body, signal),
  queries: (params: { limit?: number; user?: string } = {}, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.user) qs.set("user", params.user);
    const s = qs.toString();
    return request<{ queries: SavedQuery[] }>(`/queries${s ? `?${s}` : ""}`, { signal });
  },
  savedQuery: (id: string, signal?: AbortSignal) => request<SavedQuery>(`/queries/${id}`, { signal }),
};
