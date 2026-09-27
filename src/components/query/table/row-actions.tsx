"use client";

import { DataTableFloatingBar } from "@/components/data-table/data-table-floating-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Row } from "@/lib/api/types";
import { copyWithToast } from "@/lib/copy";
import { downloadCsv } from "@/lib/export-csv";
import { SELECT_COLUMN } from "@/lib/schema/to-table-schema";
import { useFilterActions } from "@/lib/store/hooks/useFilterActions";
import type { DataTableFeatures } from "@/lib/table/features";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Download, Eye, MoreHorizontal } from "lucide-react";

export const ACTIONS_COLUMN = "_actions";

/** Column 0: a per-row menu. Sits next to the select checkbox. */
export function rowActionsColumn(): ColumnDef<DataTableFeatures, Row> {
  return {
    id: ACTIONS_COLUMN,
    enableHiding: false,
    enableSorting: false,
    enableResizing: false,
    size: 28,
    minSize: 28,
    maxSize: 28,
    header: () => null,
    cell: ({ row }) => <RowMenu row={row.original} rowId={row.id} />,
  };
}

function RowMenu({ row, rowId }: { row: Row; rowId: string }) {
  const { setFilters } = useFilterActions<Record<string, unknown>>();
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-5" aria-label="Row actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ uuid: rowId })}>
            <Eye className="size-4" /> View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyWithToast("Doc ID", row._id)}>
            <Copy className="size-4" /> Copy doc ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyWithToast("Row JSON", JSON.stringify(row, null, 2))}>
            <Copy className="size-4" /> Copy as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Bulk actions for checked rows. */
export function SelectionBar({ tabTitle }: { tabTitle: string }) {
  return (
    <DataTableFloatingBar<Row>>
      {({ rows, table }) => {
        const data = rows.map((r) => r.original);
        const visible = table.getVisibleLeafColumns().map((c) => c.id).filter((id) => id !== SELECT_COLUMN && id !== ACTIONS_COLUMN);
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => downloadCsv(`${tabTitle}.csv`, data, visible)}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => copyWithToast(`${data.length} rows as JSON`, JSON.stringify(data, null, 2))}>
              <Copy className="size-4" /> Copy JSON
            </Button>
          </>
        );
      }}
    </DataTableFloatingBar>
  );
}
