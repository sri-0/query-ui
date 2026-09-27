"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTabs, type Tab } from "@/lib/store/tabs";
import { useUi } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { Copy, Home, Link2, MoreHorizontal, Pencil, Plus, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { copyWithToast } from "@/lib/copy";
import { RainbowButton } from "./rainbow-button";

export function TabBar() {
  const tabs = useTabs((s) => s.tabs);
  const activeId = useTabs((s) => s.activeId);
  const setActive = useTabs((s) => s.setActive);
  const openComposer = useUi((s) => s.openComposer);
  const aiOpen = useUi((s) => s.aiOpen);
  const setAiOpen = useUi((s) => s.setAiOpen);

  return (
    <div className="flex h-10 shrink-0 items-stretch gap-1 border-b bg-sidebar px-1">
      <div className="flex items-center">
        <SidebarTrigger className="size-8" />
      </div>
      <div className="flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto">
        {tabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} active={tab.id === activeId} onActivate={() => setActive(tab.id)} />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mt-1 size-8 shrink-0" onClick={() => openComposer()} aria-label="New query">
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New query</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center pr-1">
        <RainbowButton onClick={() => setAiOpen((v) => !v)} aria-pressed={aiOpen} aria-label="Toggle AI assistant">
          <Sparkles className="size-3.5" /> AI Chat
        </RainbowButton>
      </div>
    </div>
  );
}

function TabItem({ tab, active, onActivate }: { tab: Tab; active: boolean; onActivate: () => void }) {
  const close = useTabs((s) => s.close);
  const rename = useTabs((s) => s.rename);
  const duplicate = useTabs((s) => s.duplicate);
  const openComposer = useUi((s) => s.openComposer);

  const share = () => {
    if (tab.kind !== "query") return;
    if (!tab.lastQueryId) {
      toast.error("Run the query first to get a shareable link");
      return;
    }
    copyWithToast("Share link", `${window.location.origin}/query/${tab.lastQueryId}`);
  };

  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => e.key === "Enter" && onActivate()}
      className={cn(
        "group relative mt-1 flex max-w-64 min-w-0 cursor-pointer items-center gap-1 rounded-t-md border border-b-0 pr-1 pl-3 text-sm select-none",
        active ? "border-border bg-background text-foreground" : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {tab.kind === "home" ? <Home className="size-3.5 shrink-0" /> : tab.shared ? <Users className="size-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className="truncate pr-1">{tab.title}</span>
      {tab.kind === "query" && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Tab actions"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "overflow-hidden rounded-sm p-0.5 transition-all duration-150 hover:bg-muted",
                  active ? "w-5 opacity-70 hover:opacity-100" : "w-0 p-0 opacity-0 group-hover:w-5 group-hover:p-0.5 group-hover:opacity-70",
                )}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={share}>
                <Link2 className="size-4" /> Share query link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openComposer(tab.id)}>
                <Pencil className="size-4" /> Edit query
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicate(tab.id)}>
                <Copy className="size-4" /> Duplicate tab
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const title = window.prompt("Rename tab", tab.title);
                  if (title) rename(tab.id, title);
                }}
              >
                <Pencil className="size-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => close(tab.id)}>
                <X className="size-4" /> Close tab
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            aria-label="Close tab"
            onClick={(e) => {
              e.stopPropagation();
              close(tab.id);
            }}
            className={cn(
              "overflow-hidden rounded-sm p-0.5 transition-all duration-150 hover:bg-muted",
              active ? "w-5 opacity-70 hover:opacity-100" : "w-0 p-0 opacity-0 group-hover:w-5 group-hover:p-0.5 group-hover:opacity-70",
            )}
          >
            <X className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
