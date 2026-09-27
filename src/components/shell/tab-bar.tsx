"use client";

import { NewQueryDialog } from "@/components/landing/new-query-dialog";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTabs } from "@/lib/store/tabs";
import { cn } from "@/lib/utils";
import { Home, Plus, X } from "lucide-react";
import * as React from "react";

export function TabBar() {
  const tabs = useTabs((s) => s.tabs);
  const activeId = useTabs((s) => s.activeId);
  const setActive = useTabs((s) => s.setActive);
  const close = useTabs((s) => s.close);
  const rename = useTabs((s) => s.rename);
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex h-10 shrink-0 items-stretch gap-1 border-b bg-sidebar px-1">
      <div className="flex items-center">
        <SidebarTrigger className="size-8" />
      </div>
      <div className="flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => e.key === "Enter" && setActive(tab.id)}
              onDoubleClick={() => {
                if (tab.kind !== "query") return;
                const title = window.prompt("Rename tab", tab.title);
                if (title) rename(tab.id, title);
              }}
              className={cn(
                "group relative mt-1 flex max-w-56 min-w-0 cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-3 text-sm select-none",
                active
                  ? "border-border bg-background text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              {tab.kind === "home" ? <Home className="size-3.5 shrink-0" /> : null}
              <span className="truncate">{tab.title}</span>
              {tab.kind === "query" && (
                <button
                  type="button"
                  aria-label="Close tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    close(tab.id);
                  }}
                  className="-mr-1.5 ml-0.5 rounded-sm p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100 data-[active=true]:opacity-100"
                  data-active={active}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mt-1 size-8 shrink-0" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New query</TooltipContent>
        </Tooltip>
      </div>
      <NewQueryDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
