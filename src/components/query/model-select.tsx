"use client";

import { modelsOptions } from "@/lib/api/query-options";
import { useQuery } from "@tanstack/react-query";
import { MultiSelect } from "./multi-select";

/** Multi-select of models. Empty selection means "all models". */
export function ModelSelect({ value, onChange, className }: { value: string[]; onChange: (models: string[]) => void; className?: string }) {
  const { data, isLoading } = useQuery(modelsOptions());
  return (
    <MultiSelect
      value={value}
      onChange={onChange}
      options={(data?.models ?? []).map((m) => ({ value: m.name, hint: m.docCount.toLocaleString() }))}
      placeholder="Models"
      emptyLabel="All models"
      searchPlaceholder="Search models..."
      loading={isLoading}
      className={className}
    />
  );
}
