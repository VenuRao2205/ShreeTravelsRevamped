"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

/* ---------- date range ---------- */

export type Preset = "today" | "yesterday" | "7d" | "30d" | "all" | "custom";
export type Range = { preset: Preset; fromDay: string; toDay: string };

const presets: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Pick dates" },
];

const dayStr = (d: Date) => d.toLocaleDateString("en-CA"); // yyyy-mm-dd in the browser's timezone
const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
export const initialRange = (): Range => ({ preset: "today", fromDay: dayStr(new Date()), toDay: dayStr(new Date()) });

/** Start and end of the chosen days, as instants. Today is worked out when asked, so it rolls over at midnight. */
export function rangeParams(r: Range): Record<string, string> {
  let from = r.fromDay, to = r.toDay;
  if (r.preset === "all") return {};
  if (r.preset === "today") from = to = dayStr(new Date());
  if (r.preset === "yesterday") from = to = dayStr(ago(1));
  if (r.preset === "7d") { from = dayStr(ago(6)); to = dayStr(new Date()); }
  if (r.preset === "30d") { from = dayStr(ago(29)); to = dayStr(new Date()); }
  const out: Record<string, string> = {};
  if (from) out.from = new Date(`${from}T00:00:00`).toISOString();
  if (to) out.to = new Date(`${to}T23:59:59.999`).toISOString();
  return out;
}

export function rangeLabel(r: Range) {
  const f = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const p = rangeParams(r);
  if (r.preset === "all") return "all dates";
  if (r.preset === "today") return `today, ${f(dayStr(new Date()))}`;
  if (r.preset === "yesterday") return `yesterday, ${f(dayStr(ago(1)))}`;
  const a = p.from ? f(dayStr(new Date(p.from))) : "the beginning";
  const b = p.to ? f(dayStr(new Date(p.to))) : "now";
  return a === b ? a : `${a} to ${b}`;
}

export function RangeBar({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <CalendarDays size={18} className="text-accent" aria-hidden />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {presets.map((p) => (
          <button key={p.id} aria-pressed={range.preset === p.id} onClick={() => onChange({ ...range, preset: p.id })}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${range.preset === p.id ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>
            {p.label}
          </button>
        ))}
      </div>
      {range.preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="date" aria-label="From date" className="field !w-auto !py-1.5" value={range.fromDay} max={range.toDay || undefined} onChange={(e) => onChange({ ...range, fromDay: e.target.value })} />
          <span className="text-neutral-500">to</span>
          <input type="date" aria-label="To date" className="field !w-auto !py-1.5" value={range.toDay} min={range.fromDay || undefined} onChange={(e) => onChange({ ...range, toDay: e.target.value })} />
        </div>
      )}
      <p className="w-full text-sm text-neutral-500">Showing {rangeLabel(range)}</p>
    </div>
  );
}

/* ---------- search, chips, pager ---------- */

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
      <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="field !py-2 !pl-10 !pr-9 [&::-webkit-search-cancel-button]:hidden" />
      {value && <button onClick={() => onChange("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><X size={16} /></button>}
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o) => (
        <button key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${value === o.id ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>
          {o.label}{o.count !== undefined && <span className="ml-1.5 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function pagesToShow(page: number, last: number) {
  const set = new Set([1, last, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push("gap"); out.push(n); });
  return out;
}

export function Pager({ total, page, pageSize, onPage, onPageSize }: { total: number; page: number; pageSize: number; onPage: (p: number) => void; onPageSize: (n: number) => void }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const btn = "grid h-9 min-w-9 place-items-center rounded-full border px-2 text-sm font-semibold transition-colors disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-neutral-400">
      <p>{total ? `Showing ${from}–${to} of ${total}` : "No results"}</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">Per page
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="field !w-auto !py-1.5">
            {[10, 25, 50].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        {last > 1 && (
          <nav className="flex items-center gap-1.5" aria-label="Pages">
            <button className={`${btn} border-white/20 hover:border-brand-500`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            {pagesToShow(page, last).map((n, i) => n === "gap"
              ? <span key={`g${i}`} className="px-1">…</span>
              : <button key={n} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)} className={`${btn} ${n === page ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>{n}</button>)}
            <button className={`${btn} border-white/20 hover:border-brand-500`} disabled={page >= last} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ---------- data hook ---------- */

type Paged = { rows: unknown[]; total: number };

/** Loads one page from an admin list endpoint. Changing any filter returns to page 1. */
export function usePaged<T extends Paged>(url: string, params: Record<string, string>, onUnauthorized: () => void) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const key = JSON.stringify(params);
  const [seenKey, setSeenKey] = useState(key);
  if (key !== seenKey) { setSeenKey(key); setPage(1); }

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const unauth = useRef(onUnauthorized);
  useEffect(() => { unauth.current = onUnauthorized; });

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ ...(JSON.parse(key) as Record<string, string>), page: String(page), pageSize: String(pageSize) });
        const res = await fetch(`${url}?${qs}`, { cache: "no-store", signal: ctrl.signal });
        if (res.status === 401) return unauth.current();
        if (!res.ok) throw new Error();
        const json = (await res.json()) as T;
        // After deleting the last row on a page, step back to the last page that has rows.
        if (json.rows.length === 0 && page > 1 && json.total > 0) return setPage(Math.ceil(json.total / pageSize));
        setData(json); setError(""); setLoading(false);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Could not load this list."); setLoading(false);
      }
    }, 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [url, key, page, pageSize, tick]);

  return { data, error, loading, page, pageSize, setPage, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, reload: () => setTick((n) => n + 1) };
}
