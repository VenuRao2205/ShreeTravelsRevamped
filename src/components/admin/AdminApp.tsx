"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Check, CircleDollarSign, FileText, Inbox, LayoutDashboard, Loader2, Link2, LogOut, MessageCircle, MessageSquareQuote, Star, Trash2, X } from "lucide-react";
import { CountUp } from "@/components/ui/motion";
import { Stars } from "@/components/forms/Reviews";
import { waLink } from "@/lib/whatsapp";
import PaymentLinks from "@/components/admin/PaymentLinks";
import Bills, { type BillRow } from "@/components/admin/Bills";
import { Chips, Pager, RangeBar, SearchBox, initialRange, rangeLabel, rangeParams, useDebounced, usePaged, type Range } from "@/components/admin/Filters";

type Lead = { _id: string; name: string; email?: string; phone: string; service?: string; message: string; status: string; createdAt: string };
type Review = { _id: string; name: string; company?: string; rating: number; comment: string; approved: boolean; createdAt: string };
type Payment = { _id: string; merchantOrderId: string; name: string; email: string; phone?: string; amount: number; state: string; remarks?: string; createdAt: string };

const when = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const origin = () => (typeof window === "undefined" ? "" : window.location.origin);
const leadText = (l: Lead) => `Hello ${l.name}, this is Shree Travels, Nagpur. Thank you for your enquiry${l.service ? ` about ${l.service}` : ""}. How can we help you?`;
const payText = (p: Payment) => {
  const amt = `Rs ${(p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inv = p.remarks ? ` for invoice ${p.remarks}` : "";
  return p.state === "COMPLETED"
    ? `Hello ${p.name}, we have received your payment of ${amt}${inv}. Thank you! - Shree Travels`
    : `Hello ${p.name}, your payment of ${amt}${inv} has not gone through yet. You can pay securely here: ${origin()}/payment - Shree Travels`;
};
const statuses = ["new", "contacted", "converted", "closed"];

export default function AdminApp({ enabled, signedIn }: { enabled: boolean; signedIn: boolean }) {
  const [authed, setAuthed] = useState(signedIn);
  if (!enabled)
    return (
      <Shell>
        <p className="rounded-2xl border border-white/10 bg-ink-900 p-8 text-neutral-300">
          The admin area is switched off. Set an <code className="text-accent">ADMIN_PASSWORD</code> (at least 8 characters) in the site&rsquo;s environment variables and redeploy.
        </p>
      </Shell>
    );
  return <Shell>{authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onDone={() => setAuthed(true)} />}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[70vh] py-14">
      <div className="container-page">
        <h1 className="mb-8 text-4xl sm:text-5xl">Dashboard</h1>
        {children}
      </div>
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (res.ok) onDone(); else setErr((await res.json().catch(() => ({}))).error ?? "Could not sign in.");
  }
  return (
    <form onSubmit={submit} className="max-w-md space-y-5 rounded-3xl border border-white/10 bg-ink-900 p-8">
      <div>
        <label htmlFor="pw" className="field-label">Password</label>
        <input id="pw" type="password" autoComplete="current-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      {err && <p className="text-danger" role="alert">{err}</p>}
      <button className="btn-primary w-full" disabled={busy || !pw}>{busy && <Loader2 className="animate-spin" size={18} />} Sign in</button>
    </form>
  );
}

type Summary = {
  leadsInRange: number; paid: { count: number; amount: number; failed: number };
  avg: number; publishedCount: number; dist: { n: number; c: number }[];
  badges: { newLeads: number; pendingReviews: number };
  days: { leads: Record<string, number>; payments: Record<string, number> };
  feed: { id: string; at: string; kind: "lead" | "review" | "payment"; title: string; sub: string }[];
};

function useSummary(range: Range, onUnauthorized: () => void) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const chart = new Date(); chart.setDate(chart.getDate() - 13); chart.setHours(0, 0, 0, 0);
  const key = JSON.stringify({ ...rangeParams(range), chartFrom: chart.toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/summary?${new URLSearchParams(JSON.parse(key))}`, { cache: "no-store", signal: ctrl.signal });
        if (res.status === 401) return onUnauthorized();
        if (!res.ok) throw new Error();
        setData(await res.json()); setError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      }
    }, 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [key, tick, onUnauthorized]);
  return { data, error, reload: () => setTick((n) => n + 1) };
}

type Tab = "overview" | "leads" | "reviews" | "payments" | "bills" | "links";
const tabs: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "leads", label: "Enquiries", icon: Inbox },
  { id: "reviews", label: "Reviews", icon: MessageSquareQuote },
  { id: "payments", label: "Payments", icon: CircleDollarSign },
  { id: "bills", label: "Bills", icon: FileText },
  { id: "links", label: "Payment links", icon: Link2 },
];

type TabProps = { range: Range; onUnauthorized: () => void; onChanged: () => void };

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>(initialRange);
  const [draft, setDraft] = useState<BillRow | null>(null); // a bill the owner is turning into a payment link
  const summary = useSummary(range, onLogout);
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); onLogout(); }
  const badge: Partial<Record<Tab, number>> = { leads: summary.data?.badges.newLeads, reviews: summary.data?.badges.pendingReviews };
  const props: TabProps = { range, onUnauthorized: onLogout, onChanged: summary.reload };
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-ink-900 p-1.5" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 ${tab === id ? "text-black" : "text-neutral-300 hover:text-white"}`}>
              {tab === id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative flex items-center gap-2"><Icon size={16} />{label}
                {!!badge[id] && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs ${tab === id ? "bg-black text-[#fff]" : "bg-brand-500 text-black"}`}>{badge[id]}</span>}
              </span>
            </button>
          ))}
        </div>
        <button onClick={logout} className="btn-ghost !py-2.5"><LogOut size={17} /> Sign out</button>
      </div>
      <RangeBar range={range} onChange={setRange} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === "overview" && <Overview summary={summary} range={range} goTo={setTab} />}
          {tab === "leads" && <Leads {...props} />}
          {tab === "reviews" && <Reviews {...props} />}
          {tab === "payments" && <Payments {...props} />}
          {tab === "bills" && <Bills range={range} onUnauthorized={onLogout} onMakeLink={(b) => { setDraft(b); setTab("links"); }} />}
          {tab === "links" && <PaymentLinks range={range} onUnauthorized={onLogout} draft={draft} onDraftUsed={() => setDraft(null)} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Decimal({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [text, setText] = useState(reduce ? value.toFixed(1) : "0.0");
  useEffect(() => {
    if (reduce) return;
    const c = animate(mv, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    const off = mv.on("change", (v) => setText(v.toFixed(1)));
    return () => { c.stop(); off(); };
  }, [value, mv, reduce]);
  return <>{text}</>;
}

function Tile({ label, icon: Icon, i, onClick, children, hint }: { label: string; icon: typeof Inbox; i: number; onClick?: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <motion.button
      type="button" onClick={onClick}
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900 p-6 text-left transition-colors hover:border-brand-500/60"
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl transition-opacity group-hover:bg-brand-500/25" />
      <span className="flex items-center gap-2 text-sm text-neutral-400"><Icon size={16} className="text-accent" />{label}</span>
      <span className="mt-3 block font-display text-4xl font-bold text-white sm:text-5xl">{children}</span>
      {hint && <span className="mt-2 block text-sm text-neutral-500">{hint}</span>}
    </motion.button>
  );
}

const rupees = (paise: number) => Math.round(paise / 100);
const dayKey = (d: Date) => d.toLocaleDateString("en-CA");

function Overview({ summary, range, goTo }: { summary: ReturnType<typeof useSummary>; range: Range; goTo: (t: Tab) => void }) {
  const [series, setSeries] = useState<"leads" | "payments">("leads");
  const S = summary.data;
  if (!S) return summary.error ? <p className="text-danger" role="alert">Could not load the dashboard.</p> : <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;

  const perDay = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - k));
    const key = dayKey(d);
    return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), leads: S.days.leads[key] ?? 0, payments: rupees(S.days.payments[key] ?? 0) };
  });
  const max = Math.max(1, ...perDay.map((d) => d[series]));
  const maxDist = Math.max(1, ...S.dist.map((d) => d.c));
  const icon = { lead: Inbox, review: Star, payment: CircleDollarSign };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile i={0} label="Enquiries" icon={Inbox} onClick={() => goTo("leads")} hint={`${S.badges.newLeads} new overall`}><CountUp value={S.leadsInRange} /></Tile>
        <Tile i={1} label="Payments received" icon={CircleDollarSign} onClick={() => goTo("payments")} hint={`${S.paid.count} paid, ${S.paid.failed} failed`}>Rs <CountUp value={rupees(S.paid.amount)} /></Tile>
        <Tile i={2} label="Average rating" icon={Star} onClick={() => goTo("reviews")} hint={`${S.publishedCount} published, all time`}><Decimal value={S.avg} /></Tile>
        <Tile i={3} label="Reviews to approve" icon={MessageSquareQuote} onClick={() => goTo("reviews")} hint={S.badges.pendingReviews ? "Tap to review" : "All caught up"}><CountUp value={S.badges.pendingReviews} /></Tile>
      </div>
      <p className="-mt-2 text-sm text-neutral-500">Enquiries and payments cover {rangeLabel(range)}. Ratings and reviews to approve are always overall.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Last 14 days</h2>
            <div className="flex gap-1 rounded-full border border-white/10 p-1 text-sm">
              {(["leads", "payments"] as const).map((k) => (
                <button key={k} onClick={() => setSeries(k)} className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${series === k ? "bg-brand-500 text-black" : "text-neutral-300 hover:text-white"}`}>{k === "leads" ? "Enquiries" : "Payments"}</button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex h-52 items-end gap-1.5 sm:gap-2" role="img" aria-label={`${series === "leads" ? "Enquiries" : "Rupees received"} per day for the last 14 days`}>
            {perDay.map((d, k) => {
              const v = d[series];
              return (
                <div key={`${series}-${k}`} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${series === "payments" ? "Rs " : ""}${v}`}>
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-800 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">{series === "payments" ? "Rs " : ""}{v}</span>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: v ? `${Math.max(6, (v / max) * 100)}%` : 4 }}
                    transition={{ delay: 0.4 + k * 0.04, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full rounded-t-lg ${v ? "bg-gradient-to-t from-brand-500/70 to-brand-500" : "bg-white/10"}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-neutral-500"><span>{perDay[0].label}</span><span>{perDay[13].label}</span></div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
          <h2 className="text-2xl">Ratings</h2>
          <ul className="mt-6 space-y-3">
            {S.dist.map((d, k) => (
              <li key={d.n} className="flex items-center gap-3 text-sm">
                <span className="flex w-8 items-center gap-1 text-neutral-300">{d.n}<Star size={13} className="fill-brand-500 text-accent" /></span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span initial={{ width: 0 }} animate={{ width: `${(d.c / maxDist) * 100}%` }} transition={{ delay: 0.6 + k * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="block h-full rounded-full bg-brand-500" />
                </span>
                <span className="w-6 text-right text-neutral-400">{d.c}</span>
              </li>
            ))}
          </ul>
          {S.dist.every((d) => d.c === 0) && <p className="mt-5 text-sm text-neutral-500">Reviews will show here once customers write them.</p>}
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
        <h2 className="text-2xl">Recent activity</h2>
        {S.feed.length === 0 ? <p className="mt-4 text-neutral-500">Nothing for {rangeLabel(range)}. Pick a wider date range to see earlier activity.</p> : (
          <ul className="mt-5 divide-y divide-white/10">
            {S.feed.map((f, k) => {
              const Icon = icon[f.kind];
              return (
                <motion.li key={f.kind + f.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 + k * 0.06 }} className="flex items-center gap-4 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500/15 text-accent"><Icon size={18} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-white">{f.title}</span>{f.sub && <span className="block truncate text-sm text-neutral-500">{f.sub}</span>}</span>
                  <span className="shrink-0 text-xs text-neutral-500">{when(f.at)}</span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>
      <WhatsAppCard />
    </div>
  );
}


function WhatsAppCard() {
  const [st, setSt] = useState<{ configured: boolean; ownerSet: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { fetch("/api/admin/whatsapp", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setSt).catch(() => setSt(null)); }, 0);
    return () => clearTimeout(t);
  }, []);
  async function test() {
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/admin/whatsapp", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setNote(res.ok ? { ok: true, text: "Test message sent. Check WhatsApp on your phone." } : { ok: false, text: data.error ?? "The test message failed." });
    } catch { setNote({ ok: false, text: "The test message failed." }); }
    setBusy(false);
  }
  if (!st) return null;
  const ready = st.configured && st.ownerSet;
  return (
    <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl"><MessageCircle size={22} className="text-accent" /> WhatsApp alerts</h2>
          <p className="mt-1 text-neutral-400">{ready ? "Connected. New enquiries and payments message you, and paying customers get a receipt." : st.configured ? "Almost there. Add WHATSAPP_OWNER_NUMBER in the site settings to get alerts." : "Not set up. Add the WhatsApp settings in Netlify to turn on automatic messages."}</p>
        </div>
        {ready && <button onClick={test} disabled={busy} className="btn-ghost disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={16} />} Send test message</button>}
      </div>
      {note && <p className={`mt-3 text-sm ${note.ok ? "text-accent" : "text-danger"}`} role="status">{note.text}</p>}
    </motion.section>
  );
}

function ListState({ loading, error, count, label, range }: { loading: boolean; error: string; count: number | null; label: string; range: Range }) {
  if (error) return <p className="text-danger" role="alert">{error}</p>;
  if (count === null) return loading ? <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p> : null;
  if (count === 0 && !loading) return <p className="rounded-2xl border border-dashed border-white/20 p-8 text-neutral-400">No {label} for {rangeLabel(range)}. Change the filters or pick a wider date range.</p>;
  return null;
}

const fade = (loading: boolean) => `transition-opacity ${loading ? "opacity-50" : ""}`;

function Leads({ range, onUnauthorized, onChanged }: TabProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const dq = useDebounced(q.trim());
  const list = usePaged<{ rows: Lead[]; total: number }>("/api/admin/leads", { ...rangeParams(range), ...(dq && { q: dq }), ...(status !== "all" && { status }) }, onUnauthorized);
  const rows = list.data?.rows ?? null;
  async function setLeadStatus(id: string, status: string) {
    await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    list.reload(); onChanged();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, phone, email or message" />
        <Chips value={status} onChange={setStatus} options={[{ id: "all", label: "All" }, ...statuses.map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
      </div>
      <ListState loading={list.loading} error={list.error} count={list.data ? list.data.total : null} label="enquiries" range={range} />
      <div className={`space-y-4 ${fade(list.loading)}`}>
        {rows?.map((l) => (
          <article key={l._id} className="rounded-2xl border border-white/10 bg-ink-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl">{l.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">{when(l.createdAt)}{l.service ? `, ${l.service}` : ""}</p>
              </div>
              <label className="text-sm">
                <span className="sr-only">Status</span>
                <select value={l.status} onChange={(e) => setLeadStatus(l._id, e.target.value)} className="field !w-auto !py-2 capitalize">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-neutral-200">{l.message}</p>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-accent">
              <a href={`tel:${l.phone}`} className="hover:underline">{l.phone}</a>
              {l.email && <a href={`mailto:${l.email}`} className="break-all hover:underline">{l.email}</a>}
              <a href={waLink(l.phone, leadText(l))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><MessageCircle size={15} /> WhatsApp</a>
            </p>
          </article>
        ))}
      </div>
      {list.data && <Pager total={list.data.total} page={list.page} pageSize={list.pageSize} onPage={list.setPage} onPageSize={list.setPageSize} />}
    </div>
  );
}

function Reviews({ range, onUnauthorized, onChanged }: TabProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const dq = useDebounced(q.trim());
  const list = usePaged<{ rows: Review[]; total: number; counts: { all: number; pending: number; published: number } }>("/api/admin/reviews", { ...rangeParams(range), ...(dq && { q: dq }), ...(filter !== "all" && { status: filter }) }, onUnauthorized);
  const rows = list.data?.rows ?? null;
  const counts = list.data?.counts;
  async function approve(id: string, approved: boolean) {
    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved }) });
    list.reload(); onChanged();
  }
  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    list.reload(); onChanged();
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, company or comment" />
        <Chips value={filter} onChange={setFilter} options={[{ id: "all", label: "All", count: counts?.all }, { id: "pending", label: "Pending", count: counts?.pending }, { id: "published", label: "Published", count: counts?.published }]} />
      </div>
      <ListState loading={list.loading} error={list.error} count={list.data ? list.data.total : null} label="reviews" range={range} />
      <div className={`grid gap-4 md:grid-cols-2 ${fade(list.loading)}`}>
        <AnimatePresence initial={false}>
          {rows?.map((r, i) => (
            <motion.article
              key={r._id} layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              transition={{ delay: Math.min(i, 8) * 0.05, type: "spring", stiffness: 260, damping: 26 }}
              className={`relative flex flex-col overflow-hidden rounded-3xl border bg-ink-900 p-6 ${r.approved ? "border-white/10" : "border-brand-500/50"}`}
            >
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${r.approved ? "bg-brand-500" : "bg-brand-500/40"}`} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Stars value={r.rating} />
                <motion.span key={String(r.approved)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full px-3 py-1 text-xs font-semibold ${r.approved ? "bg-brand-500 text-black" : "bg-white/10 text-neutral-300"}`}>
                  {r.approved ? "Published" : "Waiting for approval"}
                </motion.span>
              </div>
              <p className="mt-4 flex-1 text-lg leading-relaxed text-neutral-200">&ldquo;{r.comment}&rdquo;</p>
              <p className="mt-4 text-sm text-neutral-500"><span className="font-semibold text-white">{r.name}</span>{r.company ? `, ${r.company}` : ""} &middot; {when(r.createdAt)}</p>
              <div className="mt-5 flex gap-3">
                {r.approved
                  ? <button onClick={() => approve(r._id, false)} className="btn-ghost !py-2"><X size={16} /> Unpublish</button>
                  : <button onClick={() => approve(r._id, true)} className="btn-primary !py-2"><Check size={16} /> Publish</button>}
                <button onClick={() => remove(r._id)} className="btn-ghost !py-2 hover:!border-red-500 hover:!text-danger"><Trash2 size={16} /> Delete</button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      {list.data && <Pager total={list.data.total} page={list.page} pageSize={list.pageSize} onPage={list.setPage} onPageSize={list.setPageSize} />}
    </div>
  );
}

function Payments({ range, onUnauthorized }: TabProps) {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"all" | "COMPLETED" | "FAILED" | "PENDING">("all");
  const dq = useDebounced(q.trim());
  const list = usePaged<{ rows: Payment[]; total: number; paidTotal: number; counts: { all: number; COMPLETED: number; FAILED: number; PENDING: number } }>("/api/admin/payments", { ...rangeParams(range), ...(dq && { q: dq }), ...(state !== "all" && { status: state }) }, onUnauthorized);
  const rows = list.data?.rows ?? null;
  const c = list.data?.counts;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, invoice or order ID" />
        <Chips value={state} onChange={setState} options={[{ id: "all", label: "All", count: c?.all }, { id: "COMPLETED", label: "Paid", count: c?.COMPLETED }, { id: "FAILED", label: "Failed", count: c?.FAILED }, { id: "PENDING", label: "Pending", count: c?.PENDING }]} />
      </div>
      {list.data && <p className="text-neutral-300">Received in this period: <span className="font-display text-xl font-bold text-white">Rs {(list.data.paidTotal / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>}
      <ListState loading={list.loading} error={list.error} count={list.data ? list.data.total : null} label="payments" range={range} />
      {rows && rows.length > 0 && (
        <div className={`overflow-x-auto rounded-2xl border border-white/10 ${fade(list.loading)}`}>
          <table className="w-full min-w-[46rem] text-left">
            <thead className="bg-ink-800 text-sm text-neutral-400">
              <tr><th className="p-4">Date</th><th className="p-4">Name</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Invoice</th><th className="p-4">Message</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t border-white/10 align-top">
                  <td className="p-4 text-sm text-neutral-400">{when(p.createdAt)}</td>
                  <td className="p-4"><div className="text-white">{p.name}</div><div className="text-sm text-neutral-500">{p.email}</div></td>
                  <td className="p-4 font-display text-lg font-bold text-white">Rs {(p.amount / 100).toFixed(2)}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.state === "COMPLETED" ? "bg-brand-500 text-black" : p.state === "FAILED" ? "bg-red-500/20 text-danger" : "bg-white/10 text-neutral-300"}`}>{p.state.toLowerCase()}</span></td>
                  <td className="break-all p-4 text-xs text-neutral-500"><div className="text-sm font-semibold text-white">{p.remarks || "-"}</div>{p.merchantOrderId}</td>
                  <td className="p-4 text-sm">
                    <a href={waLink(p.phone, payText(p))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 whitespace-nowrap text-accent hover:underline"><MessageCircle size={15} /> {p.state === "COMPLETED" ? "Send receipt" : "Send reminder"}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && <Pager total={list.data.total} page={list.page} pageSize={list.pageSize} onPage={list.setPage} onPageSize={list.setPageSize} />}
    </div>
  );
}
