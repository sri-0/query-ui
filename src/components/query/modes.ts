import type { QueryMode } from "@/lib/store/tabs";
import { ListFilter, Search, Sparkles, Terminal, type LucideIcon } from "lucide-react";

/** Single source of truth for query authoring modes shown in the composer and the input row. */
export const MODE_META: Record<QueryMode, { label: string; description: string; icon: LucideIcon }> = {
  builder: { label: "Builder", description: "Typed filters from the schema", icon: ListFilter },
  lucene: { label: "Lucene", description: "Lucene query syntax", icon: Terminal },
  text: { label: "Full text", description: "Full-text search across text fields", icon: Search },
  semantic: { label: "Semantic", description: "Semantic (vector) search", icon: Sparkles },
};

export const MODE_ORDER: QueryMode[] = ["builder", "lucene", "text", "semantic"];
