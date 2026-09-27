"use client";

import { useControls } from "@/components/controls";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/table/features";
import { cn } from "@/lib/utils";
import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, EyeOff, ListFilter, X } from "lucide-react";
import type React from "react";

interface DataTableColumnHeaderProps<TData extends RowData, TValue> extends React.ComponentProps<"div"> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

/**
 * Column header: click the title to toggle sort; the chevron opens a menu with
 * explicit sort directions, a jump to the column's filter, and hide.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({ column, title, className, ...props }: DataTableColumnHeaderProps<TData, TValue>) {
  const { setOpen } = useControls();
  const canSort = column.getCanSort();
  const canFilter = column.getCanFilter();
  const canHide = column.getCanHide();
  const sorted = column.getIsSorted();

  if (!canSort && !canFilter && !canHide) {
    return (
      <div className={cn(className)} {...props}>
        {title}
      </div>
    );
  }

  return (
    <div className={cn("group/header flex h-7 w-full items-center gap-1", className)} {...props}>
      <Button
        variant="ghost"
        disabled={!canSort}
        onClick={() => column.toggleSorting(undefined)}
        className="h-7 min-w-0 flex-1 justify-start gap-1 px-0 hover:bg-transparent disabled:opacity-100"
      >
        <span className="truncate">{title}</span>
        {sorted === "asc" && <ArrowUp className="size-3 shrink-0 text-accent-foreground" />}
        {sorted === "desc" && <ArrowDown className="size-3 shrink-0 text-accent-foreground" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground opacity-0 group-hover/header:opacity-100 data-[state=open]:opacity-100"
            aria-label={`${title} column actions`}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="size-4" /> Sort ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="size-4" /> Sort descending
              </DropdownMenuItem>
              {sorted && (
                <DropdownMenuItem onClick={() => column.clearSorting()}>
                  <ArrowUpDown className="size-4" /> Clear sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {canFilter && (
            <>
              {canSort && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <ListFilter className="size-4" /> Filter this column
              </DropdownMenuItem>
              {column.getIsFiltered() && (
                <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                  <X className="size-4" /> Clear filter
                </DropdownMenuItem>
              )}
            </>
          )}
          {canHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="size-4" /> Hide column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
