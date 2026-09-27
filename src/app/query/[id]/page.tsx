"use client";

import { api } from "@/lib/api/client";
import { savedQueryToTab } from "@/lib/schema/saved-query";
import { useTabs } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

/** Share link target: /query/:id opens the audited query in a new tab, then returns home. */
export default function SharedQueryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const openQuery = useTabs((s) => s.openQuery);
  const { data, error } = useQuery({ queryKey: ["saved-query", id], queryFn: ({ signal }) => api.savedQuery(id, signal) });
  const opened = React.useRef(false);

  React.useEffect(() => {
    if (!data || opened.current) return;
    opened.current = true;
    openQuery({ ...savedQueryToTab(data), title: `Shared: ${data.indices.join(", ")}` });
    router.replace("/");
  }, [data, openQuery, router]);

  return (
    <div className="flex h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
      {error ? `Could not load query ${id}: ${error.message}` : <><Loader2 className="size-4 animate-spin" /> Opening shared query…</>}
    </div>
  );
}
