"use client";

import { Landing } from "@/components/landing/landing";
import { QueryTabView } from "@/components/query/query-tab";
import { SidebarInset } from "@/components/ui/sidebar";
import { useTabs } from "@/lib/store/tabs";
import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { TabBar } from "./tab-bar";

/** True once on the client; avoids rendering persisted tabs during SSR. */
function useHydrated() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AppShell() {
  const tabs = useTabs((s) => s.tabs);
  const activeId = useTabs((s) => s.activeId);
  const hydrated = useHydrated();

  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <TabBar />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {hydrated &&
            tabs.map((tab) => (
              <div key={tab.id} className="absolute inset-0 overflow-hidden" hidden={tab.id !== activeId}>
                {tab.kind === "home" ? <Landing /> : <QueryTabView tab={tab} active={tab.id === activeId} />}
              </div>
            ))}
        </div>
      </SidebarInset>
    </>
  );
}
