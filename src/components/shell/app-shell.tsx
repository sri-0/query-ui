"use client";

import { Landing } from "@/components/landing/landing";
import { ComposerHost } from "@/components/query/composer/composer-host";
import { QueryTabView } from "@/components/query/query-tab";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarInset } from "@/components/ui/sidebar";
import { selectActiveTab, useTabs } from "@/lib/store/tabs";
import { useUi } from "@/lib/store/ui";
import { useHydrated } from "@/hooks/use-hydrated";
import { AiPanel } from "./ai-panel";
import { AppSidebar } from "./app-sidebar";
import { TabBar } from "./tab-bar";


export function AppShell() {
  // Only the active tab is mounted: table hotkeys (⌘B, ⌘K, Esc) are window
  // listeners, so mounting every tab would fire them once per tab. Tab state
  // lives in the store and query results in the TanStack cache, so switching
  // back is cheap.
  const active = useTabs(selectActiveTab);
  const aiOpen = useUi((s) => s.aiOpen);
  const hydrated = useHydrated();

  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <TabBar />
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel id="workspace" minSize="40%" className="min-w-0">
            <div className="h-full min-h-0 overflow-hidden">
              {hydrated && active && (active.kind === "home" ? <Landing /> : <QueryTabView key={active.id} tab={active} />)}
            </div>
          </ResizablePanel>
          {/* The assistant is global: it survives tab switches and can compose queries from Home. */}
          {aiOpen && (
            <>
              <ResizableHandle className="w-0 bg-transparent after:w-3" />
              <ResizablePanel id="assistant" defaultSize="26%" minSize="18%" maxSize="45%" className="min-w-0">
                <AiPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </SidebarInset>
      <ComposerHost />
    </>
  );
}
