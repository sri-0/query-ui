"use client";

import { useDraftValue } from "@/hooks/use-draft-value";
import { Input } from "@/components/ui/input";
import * as React from "react";

/** Text input that commits on Enter or blur and reverts on Escape. */
export function CommitInput({
  value,
  onCommit,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft, reset] = useDraftValue(value);
  return (
    <Input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(draft);
        if (e.key === "Escape") reset();
      }}
    />
  );
}
