"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

/**
 * Removable badge. `removeAs="span"` is for chips nested inside another
 * button (a nested <button> is invalid HTML).
 */
export function Chip({ label, onRemove, removeAs = "button" }: { label: string; onRemove: () => void; removeAs?: "button" | "span" }) {
  const Remove = removeAs;
  return (
    <Badge variant="secondary" className="max-w-full gap-1 font-mono text-[11px]">
      <span className="truncate">{label}</span>
      <Remove
        {...(removeAs === "button" ? { type: "button" as const } : { role: "button" })}
        aria-label={`Remove ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded-sm hover:text-foreground"
      >
        <X className="size-3" />
      </Remove>
    </Badge>
  );
}
