"use client";

import { ModelSelect } from "@/components/query/model-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTabs } from "@/lib/store/tabs";
import { Search, SlidersHorizontal } from "lucide-react";
import * as React from "react";

/** Pick the models for a new tab, then start from the search bar or the builder. */
export function NewQueryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const openQuery = useTabs((s) => s.openQuery);
  const [selected, setSelected] = React.useState<string[]>([]);

  const start = (mode: "search" | "builder") => {
    openQuery({ models: selected, openBuilder: mode === "builder" });
    onOpenChange(false);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New query</DialogTitle>
          <DialogDescription>Choose the models to search. Leave empty to search everything.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Models</Label>
          <ModelSelect value={selected} onChange={setSelected} />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => start("builder")}>
            <SlidersHorizontal className="size-4" /> Start with builder
          </Button>
          <Button onClick={() => start("search")}>
            <Search className="size-4" /> Start with search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
