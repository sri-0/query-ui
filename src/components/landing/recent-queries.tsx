"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { recentQueriesOptions } from "@/lib/api/query-options";
import { usePatchQuery } from "@/lib/api/saved-queries";
import type { SavedQuery } from "@/lib/api/types";
import { copyWithToast } from "@/lib/copy";
import { describeSavedQuery, savedQueryToTab } from "@/lib/schema/saved-query";
import { useTabs } from "@/lib/store/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Copy, Link2, MoreHorizontal, Play, Star, StarOff } from "lucide-react";
import * as React from "react";

const PAGE_SIZE = 10;
const features = tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
const helper = createColumnHelper<typeof features, SavedQuery>();

/** Audited queries, optionally only the saved ones, paginated client-side. */
export function RecentQueries({ saved = false }: { saved?: boolean }) {
  const { data, isLoading, error } = useQuery(recentQueriesOptions(200, saved));
  const openQuery = useTabs((s) => s.openQuery);
  const reopen = React.useCallback((q: SavedQuery) => openQuery(savedQueryToTab(q)), [openQuery]);

  const columns = React.useMemo<ColumnDef<typeof features, SavedQuery>[]>(
    () => [
      helper.display({
        id: "query",
        header: "Query",
        cell: ({ row }) => (
          <span className="flex max-w-md items-center gap-2 truncate font-mono text-xs">
            {row.original.saved && <Star className="size-3 shrink-0 fill-current text-warning" />}
            {row.original.name ? <span className="font-sans font-medium">{row.original.name}</span> : null}
            <span className="truncate text-muted-foreground">{describeSavedQuery(row.original)}</span>
          </span>
        ),
      }),
      helper.accessor("indices", {
        header: "Models",
        cell: ({ getValue }) => (
          <div className="flex flex-wrap gap-1">
            {getValue().map((m) => (
              <Badge key={m} variant="outline" className="font-mono text-[10px]">
                {m}
              </Badge>
            ))}
          </div>
        ),
      }),
      helper.accessor("resultCount", {
        header: () => <div className="text-right">Results</div>,
        cell: ({ getValue }) => <div className="text-right tabular-nums">{getValue().toLocaleString()}</div>,
      }),
      helper.accessor("tookMs", {
        header: () => <div className="text-right">Took</div>,
        cell: ({ getValue }) => <div className="text-right tabular-nums text-muted-foreground">{getValue()} ms</div>,
      }),
      helper.accessor("createdAt", {
        header: "When",
        cell: ({ getValue }) => <span className="text-muted-foreground">{formatDistanceToNow(new Date(getValue()), { addSuffix: true })}</span>,
      }),
      helper.accessor("user", {
        header: "By",
        cell: ({ getValue }) => <UserAvatar user={getValue()} />,
      }),
      helper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => <QueryActions query={row.original} onOpen={() => reopen(row.original)} />,
      }),
      // TanStack v9's column helper narrows TValue per accessor; the table wants the wide union.
    ] as ColumnDef<typeof features, SavedQuery>[],
    [reopen],
  );

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });
  const rows = React.useMemo(() => data?.queries ?? [], [data]);
  const tableOptions = React.useMemo(
    () => ({ features, data: rows, columns, state: { pagination }, onPaginationChange: setPagination }),
    [rows, columns, pagination],
  );
  const table = useTable(tableOptions);

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (error) return <p className="text-sm text-destructive">Could not load queries: {error.message}</p>;
  if (!data?.queries.length) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        {saved ? "No saved queries yet. Save one from a tab's menu or from the recent list." : "No queries yet. Run one and it will appear here."}
      </p>
    );
  }

  const page = table.state.pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className={h.id === "user" || h.id === "actions" ? "w-10" : undefined}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => reopen(row.original)}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => table.previousPage()} aria-disabled={!table.getCanPreviousPage()} className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {pageNumbers(page, pageCount).map((p, i) =>
              p === null ? (
                <PaginationItem key={`gap-${i}`}>
                  <span className="px-2 text-muted-foreground">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={() => table.setPageIndex(p)} className="cursor-pointer">
                    {p + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext onClick={() => table.nextPage()} aria-disabled={!table.getCanNextPage()} className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function QueryActions({ query, onOpen }: { query: SavedQuery; onOpen: () => void }) {
  const patch = usePatchQuery();
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="size-7" aria-label="Query actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={onOpen}>
            <Play className="size-4" /> Open in new tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => patch.mutate({ id: query.id, patch: { saved: !query.saved } })}>
            {query.saved ? <StarOff className="size-4" /> : <Star className="size-4" />}
            {query.saved ? "Remove from saved" : "Save query"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyWithToast("Share link", `${window.location.origin}/query/${query.id}`)}>
            <Link2 className="size-4" /> Copy share link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyWithToast("Request JSON", JSON.stringify(query.request, null, 2))}>
            <Copy className="size-4" /> Copy request JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserAvatar({ user }: { user: string }) {
  const initials = user
    .split(/[.\s_@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">{initials || "?"}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>{user}</TooltipContent>
    </Tooltip>
  );
}

/** Current page, neighbours, first and last; `null` marks a gap. */
function pageNumbers(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const set = new Set([0, count - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}
