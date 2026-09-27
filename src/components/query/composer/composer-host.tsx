"use client";

import { useQueryTab, useTabs, type QueryTabState } from "@/lib/store/tabs";
import { useUi } from "@/lib/store/ui";
import { QueryComposer } from "./query-composer";

/**
 * Mounts the single composer modal. Composing a new query opens a tab only
 * when the user runs it; editing replaces the tab's query in place.
 */
export function ComposerHost() {
  const { open, tabId } = useUi((s) => s.composer);
  const closeComposer = useUi((s) => s.closeComposer);
  const editing = useQueryTab(tabId);
  const openQuery = useTabs((s) => s.openQuery);
  const replaceQuery = useTabs((s) => s.replaceQuery);

  const onRun = (state: QueryTabState) => {
    if (editing) replaceQuery(editing.id, state);
    else openQuery(state);
    closeComposer();
  };

  return <QueryComposer open={open} onOpenChange={(o) => !o && closeComposer()} initial={editing} onRun={onRun} />;
}
