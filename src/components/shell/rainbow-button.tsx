"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

/** Animated conic-gradient border button (the "border magic" pattern), rectangular. */
export function RainbowButton({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-8 overflow-hidden rounded-md p-px focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-md)-1px)] bg-background px-3 text-xs font-medium text-foreground hover:bg-accent">
        {children}
      </span>
    </button>
  );
}
