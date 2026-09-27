"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./client";
import type { QueryPatch } from "./types";

/** Toggle the saved flag (or rename) an audited query and refresh the lists. */
export function usePatchQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: QueryPatch }) => api.patchQuery(id, patch),
    onSuccess: (q) => {
      void qc.invalidateQueries({ queryKey: ["queries"] });
      if (q.saved !== undefined) toast.success(q.saved ? "Query saved" : "Query removed from saved");
    },
    onError: (e) => toast.error(e.message),
  });
}
