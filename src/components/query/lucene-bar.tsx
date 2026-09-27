"use client";

import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { useDraftValue } from "@/hooks/use-draft-value";
import { api } from "@/lib/api/client";
import type { SchemaResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import * as React from "react";

const OPERATORS = ["AND", "OR", "NOT", "TO"];
const SYNTAX = [
  { insert: "[", label: "[a TO b]", hint: "inclusive range" },
  { insert: "{", label: "{a TO b}", hint: "exclusive range" },
  { insert: ">=", label: ">=n", hint: "greater or equal" },
  { insert: "*", label: "*", hint: "wildcard" },
  { insert: '"', label: '"phrase"', hint: "exact phrase" },
  { insert: "_exists_:", label: "_exists_:field", hint: "field is present" },
];

type Suggestion = { value: string; label: string; type?: string; hint?: string; replaceToken: boolean };

/**
 * Lucene input with completions for field names, operators and values (from
 * the autocomplete API), and server-side syntax validation.
 */
export function LuceneBar({
  schema,
  models,
  value,
  onCommit,
}: {
  schema: SchemaResponse;
  models: string[];
  value: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useDraftValue(value);
  const [open, setOpen] = React.useState(false);
  const [caret, setCaret] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const debounced = useDebounce(draft, 300);
  const validation = useQuery({
    queryKey: ["validate", models, debounced],
    queryFn: ({ signal }) => api.validate({ indices: models, lucene: debounced }, signal),
    enabled: debounced.trim().length > 0,
    staleTime: 60_000,
  });

  // Token under the caret: `field:val` or a bare word.
  const token = React.useMemo(() => {
    const before = draft.slice(0, caret);
    const start = Math.max(before.lastIndexOf(" "), before.lastIndexOf("("), before.lastIndexOf("["), before.lastIndexOf("{")) + 1;
    return { text: draft.slice(start, caret), start };
  }, [draft, caret]);
  const colon = token.text.indexOf(":");
  const fieldPart = colon >= 0 ? token.text.slice(0, colon) : token.text;
  const valuePart = colon >= 0 ? token.text.slice(colon + 1) : "";
  const field = colon >= 0 ? schema.fields.find((f) => f.name === fieldPart) : undefined;

  const debouncedValue = useDebounce(valuePart, 200);
  const values = useQuery({
    queryKey: ["autocomplete", models, field?.name, debouncedValue],
    queryFn: ({ signal }) => api.autocomplete({ indices: models, field: field!.name, q: debouncedValue, size: 8 }, signal),
    enabled: !!field && field.aggregatable && !field.conflict && (field.type === "keyword" || field.type === "mac" || field.type === "boolean"),
    staleTime: 30_000,
  });

  const suggestions = React.useMemo<Suggestion[]>(() => {
    if (colon >= 0) {
      const out: Suggestion[] = [];
      if (field?.enum) {
        out.push(...field.enum.filter((v) => v.toLowerCase().includes(valuePart.toLowerCase())).map((v) => ({ value: `${fieldPart}:${v} `, label: v, replaceToken: true })));
      } else if (values.data) {
        out.push(...values.data.values.map((r) => ({ value: `${fieldPart}:${String(r.value)} `, label: String(r.value), hint: `${r.total.toLocaleString()} docs`, replaceToken: true })));
      }
      if (field && (field.type === "integer" || field.type === "float" || field.type === "date")) {
        out.push({ value: `${fieldPart}:[`, label: `${fieldPart}:[a TO b]`, hint: "range", replaceToken: true });
        out.push({ value: `${fieldPart}:>=`, label: `${fieldPart}:>=n`, hint: "at least", replaceToken: true });
      }
      return out;
    }
    const q = token.text.toLowerCase();
    const fields = schema.fields
      .filter((f) => f.type !== "vector" && !f.conflict && f.name.toLowerCase().includes(q))
      .slice(0, 12)
      .map<Suggestion>((f) => ({ value: `${f.name}:`, label: f.name, type: f.type, hint: f.description, replaceToken: true }));
    const ops = q.length > 0 ? OPERATORS.filter((o) => o.toLowerCase().startsWith(q)).map<Suggestion>((o) => ({ value: `${o} `, label: o, type: "operator", replaceToken: true })) : [];
    const syntax = q.length === 0 ? SYNTAX.map<Suggestion>((s) => ({ value: s.insert, label: s.label, type: "syntax", hint: s.hint, replaceToken: false })) : [];
    return [...fields, ...ops, ...syntax];
  }, [colon, field, fieldPart, valuePart, values.data, token.text, schema.fields]);

  const apply = (s: Suggestion) => {
    const start = s.replaceToken ? token.start : caret;
    const next = draft.slice(0, start) + s.value + draft.slice(caret);
    setDraft(next);
    const pos = start + s.value.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  };

  const status = draft.trim() ? validation.data : undefined;

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={draft}
            placeholder='Lucene, e.g. status:[500 TO 599] AND host:web-0* NOT level:debug'
            className={cn("pr-8 font-mono text-sm", status && !status.valid && "border-destructive")}
            onChange={(e) => {
              setDraft(e.target.value);
              setCaret(e.target.selectionStart ?? e.target.value.length);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
            onKeyUp={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 120);
              if (draft !== value && (status?.valid ?? true)) onCommit(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(open && suggestions.length && e.currentTarget.dataset.cmdk)) {
                onCommit(draft);
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Tab" && open && suggestions[0]) {
                e.preventDefault();
                apply(suggestions[0]);
              }
            }}
          />
          {status && (
            <span className="absolute top-1/2 right-2 -translate-y-1/2" title={status.error}>
              {status.valid ? <CheckCircle2 className="size-4 text-success" /> : <AlertCircle className="size-4 text-destructive" />}
            </span>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>No suggestions</CommandEmpty>
            <CommandGroup heading={colon >= 0 ? `Values for ${fieldPart}` : "Fields & syntax"}>
              {suggestions.map((s) => (
                <CommandItem key={s.value + s.label} value={s.value + s.label} onSelect={() => apply(s)} className="grid h-8 grid-cols-[minmax(120px,180px)_auto_1fr] items-center gap-3 py-0 text-xs">
                  <span className="truncate font-mono">{s.label}</span>
                  {s.type ? <Badge variant="outline" className="h-5 justify-self-start px-1.5 font-mono text-[10px] text-muted-foreground">{s.type}</Badge> : <span />}
                  <span className="truncate text-muted-foreground">{s.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {status && !status.valid && <p className="border-t px-3 py-2 text-xs text-destructive">{status.error}</p>}
      </PopoverContent>
    </Popover>
  );
}
