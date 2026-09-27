/** Types mirroring the query-api JSON contract. */

export type FieldType =
  | "keyword"
  | "text"
  | "boolean"
  | "integer"
  | "float"
  | "date"
  | "ip"
  | "mac"
  | "geo_point"
  | "geo_shape"
  | "vector"
  | "object";

export type Op =
  | "eq"
  | "ne"
  | "in"
  | "not_in"
  | "prefix"
  | "wildcard"
  | "match"
  | "match_phrase"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "cidr"
  | "geo_distance"
  | "geo_bounding_box"
  | "geo_polygon"
  | "geo_shape"
  | "exists"
  | "not_exists";

export type UIHints = {
  label?: string;
  cell?: string;
  hidden?: boolean;
  defaultVisible?: boolean;
};

export type ApiField = {
  name: string;
  type: FieldType;
  description?: string;
  array?: boolean;
  enum?: string[];
  ops: Op[];
  sortable: boolean;
  aggregatable: boolean;
  searchable: boolean;
  dimension?: number;
  ui?: UIHints;
  /** Cross-model view */
  models: string[];
  conflict?: boolean;
  types?: Record<string, FieldType>;
};

export type ApiModel = {
  name: string;
  title: string;
  description?: string;
  timeField?: string;
  fields: Omit<ApiField, "models">[];
};

export type ModelInfo = {
  name: string;
  title: string;
  description?: string;
  timeField?: string;
  index: string;
  docCount: number;
};

export type SchemaResponse = {
  models: ApiModel[];
  fields: ApiField[];
  timeField?: string;
  opsByType: Record<FieldType, Op[]>;
};

export type Filter = { field: string; op: Op; value?: unknown };
export type Sort = { field: string; order?: "asc" | "desc" };

export type QueryRequest = {
  indices?: string[];
  lucene?: string;
  text?: string;
  semantic?: { text: string; k?: number };
  filters?: Filter[];
  sort?: Sort[];
  size?: number;
  cursor?: string;
  direction?: "next" | "prev";
  histogram?: { field?: string; interval?: string; series?: string };
  facets?: string[];
  fields?: string[];
  meta?: boolean;
};

export type FacetRow = { value: unknown; total: number };
export type Facet = { rows?: FacetRow[]; total: number; min?: number; max?: number };

export type QueryMeta = {
  totalRowCount: number;
  filterRowCount: number;
  filterRowCountRelation: "eq" | "gte";
  tookMs: number;
  chartData?: Array<{ timestamp: number; [key: string]: number }>;
  chartSeries?: string[];
  facets?: Record<string, Facet>;
  modelCounts?: Record<string, number>;
  timeField?: string;
  queryId?: string;
};

export type Row = Record<string, unknown> & { _id: string; _model: string };

export type QueryResponse = {
  data: Row[];
  meta?: QueryMeta;
  nextCursor: string | null;
  prevCursor: string | null;
};

export type ValuesRequest = {
  indices?: string[];
  field: string;
  prefix?: string;
  q?: string;
  size?: number;
  after?: string;
  filters?: Filter[];
  lucene?: string;
  text?: string;
};

export type ValuesResponse = { field: string; values: FacetRow[]; after: string | null };

export type ValidateResponse = { valid: boolean; error?: string };

export type SavedQuery = {
  id: string;
  createdAt: string;
  user: string;
  indices: string[];
  lucene?: string;
  text?: string;
  semantic?: string;
  filterCount: number;
  resultCount: number;
  tookMs: number;
  request: QueryRequest;
  saved: boolean;
  name?: string;
};

export type QueryPatch = { saved?: boolean; name?: string };
