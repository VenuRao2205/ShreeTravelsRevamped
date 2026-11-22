"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Check, CircleDollarSign, Inbox, LayoutDashboard, Loader2, LogOut, MessageSquareQuote, Star, Trash2, X } from "lucide-react";
import { CountUp } from "@/components/ui/motion";
import { Stars } from "@/components/forms/Reviews";

type Lead = { _id: string; name: string; email?: string; phone: string; service?: string; message: string; status: string; createdAt: string };
type Review = { _id: string; name: string; company?: string; rating: number; comment: string; approved: boolean; createdAt: string };
type Payment = { _id: string; merchantOrderId: string; name: string; email: string; amount: number; state: string; remarks?: string; createdAt: string };

const when = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
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

function useList<T>(url: string, key: string, onUnauthorized: () => void) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) return onUnauthorized();
    if (!res.ok) return setError("Could not load this list.");
    setRows((await res.json())[key]);
  }, [url, key, onUnauthorized]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  return { rows, error, reload: load };
}

type Tab = "overview" | "leads" | "reviews" | "payments";
const tabs: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "leads", label: "Enquiries", icon: Inbox },
  { id: "reviews", label: "Reviews", icon: MessageSquareQuote },
  { id: "payments", label: "Payments", icon: CircleDollarSign },
];

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const leads = useList<Lead>("/api/admin/leads", "leads", onLogout);
  const reviews = useList<Review>("/api/admin/reviews", "reviews", onLogout);
  const payments = useList<Payment>("/api/admin/payments", "payments", onLogout);
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); onLogout(); }
  const pending = reviews.rows?.filter((r) => !r.approved).length ?? 0;
  const fresh = leads.rows?.filter((l) => l.status === "new").length ?? 0;
  const badge: Partial<Record<Tab, number>> = { leads: fresh, reviews: pending };
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === "overview" && <Overview leads={leads} reviews={reviews} payments={payments} goTo={setTab} />}
          {tab === "leads" && <Leads {...leads} />}
          {tab === "reviews" && <Reviews {...reviews} />}
          {tab === "payments" && <Payments {...payments} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type L<T> = { rows: T[] | null; error: string; reload: () => void };

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

function Overview({ leads, reviews, payments, goTo }: { leads: L<Lead>; reviews: L<Review>; payments: L<Payment>; goTo: (t: Tab) => void }) {
  const [series, setSeries] = useState<"leads" | "payments">("leads");
  const L = leads.rows, R = reviews.rows, P = payments.rows;

  const stats = useMemo(() => {
    const paid = (P ?? []).filter((p) => p.state === "COMPLETED");
    const published = (R ?? []).filter((r) => r.approved);
    const avg = published.length ? published.reduce((a, r) => a + r.rating, 0) / published.length : 0;
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: (R ?? []).filter((r) => r.rating === n).length }));
    const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (13 - k)); return d; });
    const perDay = days.map((d) => {
      const key = dayKey(d);
      return {
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        leads: (L ?? []).filter((l) => dayKey(new Date(l.createdAt)) === key).length,
        payments: rupees(paid.filter((p) => dayKey(new Date(p.createdAt)) === key).reduce((a, p) => a + p.amount, 0)),
      };
    });
    const feed = [
      ...(L ?? []).map((l) => ({ id: l._id, at: l.createdAt, kind: "lead" as const, title: `${l.name} sent an enquiry`, sub: l.service || l.message.slice(0, 70) })),
      ...(R ?? []).map((r) => ({ id: r._id, at: r.createdAt, kind: "review" as const, title: `${r.name} left ${r.rating}-star review`, sub: r.comment.slice(0, 70) })),
      ...(P ?? []).map((p) => ({ id: p._id, at: p.createdAt, kind: "payment" as const, title: `${p.name}: Rs ${(p.amount / 100).toFixed(0)} ${p.state.toLowerCase()}`, sub: p.remarks ? `Invoice ${p.remarks}` : "" })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 8);
    return {
      paidTotal: rupees(paid.reduce((a, p) => a + p.amount, 0)), paidCount: paid.length,
      failed: (P ?? []).filter((p) => p.state === "FAILED").length,
      avg, publishedCount: published.length, pending: (R ?? []).filter((r) => !r.approved).length,
      fresh: (L ?? []).filter((l) => l.status === "new").length, dist, perDay, feed,
    };
  }, [L, R, P]);

  if (!L || !R || !P) return leads.error || reviews.error || payments.error ? <p className="text-danger" role="alert">Could not load the dashboard.</p> : <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;

  const max = Math.max(1, ...stats.perDay.map((d) => d[series]));
  const maxDist = Math.max(1, ...stats.dist.map((d) => d.c));
  const icon = { lead: Inbox, review: Star, payment: CircleDollarSign };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile i={0} label="Enquiries" icon={Inbox} onClick={() => goTo("leads")} hint={`${stats.fresh} new`}><CountUp value={L.length} /></Tile>
        <Tile i={1} label="Payments received" icon={CircleDollarSign} onClick={() => goTo("payments")} hint={`${stats.paidCount} paid, ${stats.failed} failed`}>Rs <CountUp value={stats.paidTotal} /></Tile>
        <Tile i={2} label="Average rating" icon={Star} onClick={() => goTo("reviews")} hint={`${stats.publishedCount} published`}><Decimal value={stats.avg} /></Tile>
        <Tile i={3} label="Reviews to approve" icon={MessageSquareQuote} onClick={() => goTo("reviews")} hint={stats.pending ? "Tap to review" : "All caught up"}><CountUp value={stats.pending} /></Tile>
      </div>

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
            {stats.perDay.map((d, k) => {
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
          <div className="mt-2 flex justify-between text-xs text-neutral-500"><span>{stats.perDay[0].label}</span><span>{stats.perDay[13].label}</span></div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
          <h2 className="text-2xl">Ratings</h2>
          <ul className="mt-6 space-y-3">
            {stats.dist.map((d, k) => (
              <li key={d.n} className="flex items-center gap-3 text-sm">
                <span className="flex w-8 items-center gap-1 text-neutral-300">{d.n}<Star size={13} className="fill-brand-500 text-accent" /></span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span initial={{ width: 0 }} animate={{ width: `${(d.c / maxDist) * 100}%` }} transition={{ delay: 0.6 + k * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="block h-full rounded-full bg-brand-500" />
                </span>
                <span className="w-6 text-right text-neutral-400">{d.c}</span>
              </li>
            ))}
          </ul>
          {R.length === 0 && <p className="mt-5 text-sm text-neutral-500">Reviews will show here once customers write them.</p>}
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }} className="rounded-3xl border border-white/10 bg-ink-900 p-6">
        <h2 className="text-2xl">Recent activity</h2>
        {stats.feed.length === 0 ? <p className="mt-4 text-neutral-500">Nothing yet. New enquiries, payments and reviews appear here.</p> : (
          <ul className="mt-5 divide-y divide-white/10">
            {stats.feed.map((f, k) => {
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
    </div>
  );
}

function Empty({ rows, error, label }: { rows: unknown[] | null; error: string; label: string }) {
  if (error) return <p className="text-danger" role="alert">{error}</p>;
  if (!rows) return <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;
  if (rows.length === 0) return <p className="rounded-2xl border border-dashed border-white/20 p-8 text-neutral-400">No {label} yet.</p>;
  return null;
}

function Leads({ rows, error, reload }: L<Lead>) {
  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    reload();
  }
  return (
    <div className="space-y-4">
      <Empty rows={rows} error={error} label="enquiries" />
      {rows?.map((l) => (
        <article key={l._id} className="rounded-2xl border border-white/10 bg-ink-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl">{l.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{when(l.createdAt)}{l.service ? `, ${l.service}` : ""}</p>
            </div>
            <label className="text-sm">
              <span className="sr-only">Status</span>
              <select value={l.status} onChange={(e) => setStatus(l._id, e.target.value)} className="field !w-auto !py-2 capitalize">
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-neutral-200">{l.message}</p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-accent">
            <a href={`tel:${l.phone}`} className="hover:underline">{l.phone}</a>
            {l.email && <a href={`mailto:${l.email}`} className="break-all hover:underline">{l.email}</a>}
          </p>
        </article>
      ))}
    </div>
  );
}

function Reviews({ rows, error, reload }: L<Review>) {
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  async function approve(id: string, approved: boolean) {
    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved }) });
    reload();
  }
  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    reload();
  }
  const shown = rows?.filter((r) => filter === "all" || (filter === "pending" ? !r.approved : r.approved)) ?? [];
  const counts = { all: rows?.length ?? 0, pending: rows?.filter((r) => !r.approved).length ?? 0, published: rows?.filter((r) => r.approved).length ?? 0 };
  return (
    <div className="space-y-5">
      <Empty rows={rows} error={error} label="reviews" />
      {rows && rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "published"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors ${filter === f ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500"}`}>
                {f} <span className="opacity-70">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {shown.map((r, i) => (
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
          {shown.length === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-8 text-neutral-400">No {filter} reviews.</p>}
        </>
      )}
    </div>
  );
}

function Payments({ rows, error }: L<Payment>) {
  return (
    <div className="space-y-4">
      <Empty rows={rows} error={error} label="payments" />
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-ink-800 text-sm text-neutral-400">
              <tr><th className="p-4">Date</th><th className="p-4">Name</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Invoice</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t border-white/10 align-top">
                  <td className="p-4 text-sm text-neutral-400">{when(p.createdAt)}</td>
                  <td className="p-4"><div className="text-white">{p.name}</div><div className="text-sm text-neutral-500">{p.email}</div></td>
                  <td className="p-4 font-display text-lg font-bold text-white">Rs {(p.amount / 100).toFixed(2)}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.state === "COMPLETED" ? "bg-brand-500 text-black" : p.state === "FAILED" ? "bg-red-500/20 text-danger" : "bg-white/10 text-neutral-300"}`}>{p.state.toLowerCase()}</span></td>
                  <td className="break-all p-4 text-xs text-neutral-500"><div className="text-sm font-semibold text-white">{p.remarks || "-"}</div>{p.merchantOrderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
