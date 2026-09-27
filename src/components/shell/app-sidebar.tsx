"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTabs } from "@/lib/store/tabs";
import { Bot, Database, History, Home, Plus, Search } from "lucide-react";
import { NewQueryDialog } from "@/components/landing/new-query-dialog";
import * as React from "react";
import { useUi } from "@/lib/store/ui";
import { ThemeToggle } from "./theme-toggle";

export function AppSidebar() {
  const aiOpen = useUi((s) => s.aiOpen);
  const setAiOpen = useUi((s) => s.setAiOpen);
  const setActive = useTabs((s) => s.setActive);
  const activeId = useTabs((s) => s.activeId);
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Query UI" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Search className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Query UI</span>
                <span className="truncate text-xs text-muted-foreground">OpenSearch explorer</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home" isActive={activeId === "home"} onClick={() => setActive("home")}>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New query" onClick={() => setNewOpen(true)}>
                  <Plus />
                  <span>New query</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Recent queries" onClick={() => setActive("home")}>
                  <History />
                  <span>Recent queries</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Models" onClick={() => setActive("home")}>
                  <Database />
                  <span>Models</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="AI assistant" isActive={aiOpen} onClick={() => setAiOpen((v) => !v)}>
                  <Bot />
                  <span>AI assistant</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <NewQueryDialog open={newOpen} onOpenChange={setNewOpen} />
    </Sidebar>
  );
}
