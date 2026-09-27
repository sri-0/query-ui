"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

/** Animated conic-gradient border button (the "border magic" pattern). */
export function RainbowButton({ className, children, active, ...props }: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-8 overflow-hidden rounded-md p-px focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span
        className={cn(
          "inline-flex h-full w-full cursor-pointer items-center justify-center gap-1.5 rounded-[5px] px-3 text-xs font-medium backdrop-blur-3xl",
          active ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent",
        )}
      >
        {children}
      </span>
    </button>
  );
}
