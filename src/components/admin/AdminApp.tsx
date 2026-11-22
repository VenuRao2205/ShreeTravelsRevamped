"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, LogOut, Trash2, X } from "lucide-react";
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
        <h1 className="mb-8 text-4xl sm:text-5xl">Admin</h1>
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

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"leads" | "reviews" | "payments">("leads");
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); onLogout(); }
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2" role="tablist">
          {(["leads", "reviews", "payments"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2.5 font-semibold capitalize transition-colors ${tab === t ? "bg-brand-500 text-black" : "border border-white/20 text-neutral-300 hover:border-brand-500"}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={logout} className="btn-ghost !py-2.5"><LogOut size={17} /> Sign out</button>
      </div>
      {tab === "leads" && <Leads onUnauthorized={onLogout} />}
      {tab === "reviews" && <Reviews onUnauthorized={onLogout} />}
      {tab === "payments" && <Payments onUnauthorized={onLogout} />}
    </div>
  );
}

function Empty({ rows, error, label }: { rows: unknown[] | null; error: string; label: string }) {
  if (error) return <p className="text-danger" role="alert">{error}</p>;
  if (!rows) return <p className="text-neutral-400"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading</p>;
  if (rows.length === 0) return <p className="rounded-2xl border border-dashed border-white/20 p-8 text-neutral-400">No {label} yet.</p>;
  return null;
}

function Leads({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { rows, error, reload } = useList<Lead>("/api/admin/leads", "leads", onUnauthorized);
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

function Reviews({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { rows, error, reload } = useList<Review>("/api/admin/reviews", "reviews", onUnauthorized);
  async function approve(id: string, approved: boolean) {
    await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved }) });
    reload();
  }
  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    reload();
  }
  return (
    <div className="space-y-4">
      <Empty rows={rows} error={error} label="reviews" />
      {rows?.map((r) => (
        <article key={r._id} className="rounded-2xl border border-white/10 bg-ink-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><Stars value={r.rating} /><span className="text-sm text-neutral-500">{when(r.createdAt)}</span></div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${r.approved ? "bg-brand-500 text-black" : "bg-white/10 text-neutral-300"}`}>{r.approved ? "Published" : "Waiting for approval"}</span>
          </div>
          <p className="mt-4 text-neutral-200">{r.comment}</p>
          <p className="mt-3 text-sm text-neutral-500"><span className="font-semibold text-white">{r.name}</span>{r.company ? `, ${r.company}` : ""}</p>
          <div className="mt-5 flex gap-3">
            {r.approved
              ? <button onClick={() => approve(r._id, false)} className="btn-ghost !py-2"><X size={16} /> Unpublish</button>
              : <button onClick={() => approve(r._id, true)} className="btn-primary !py-2"><Check size={16} /> Publish</button>}
            <button onClick={() => remove(r._id)} className="btn-ghost !py-2 hover:!border-red-500 hover:!text-danger"><Trash2 size={16} /> Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Payments({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { rows, error } = useList<Payment>("/api/admin/payments", "payments", onUnauthorized);
  return (
    <div className="space-y-4">
      <Empty rows={rows} error={error} label="payments" />
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-ink-800 text-sm text-neutral-400">
              <tr><th className="p-4">Date</th><th className="p-4">Name</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Order</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-t border-white/10 align-top">
                  <td className="p-4 text-sm text-neutral-400">{when(p.createdAt)}</td>
                  <td className="p-4"><div className="text-white">{p.name}</div><div className="text-sm text-neutral-500">{p.email}</div></td>
                  <td className="p-4 font-display text-lg font-bold text-white">Rs {(p.amount / 100).toFixed(2)}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.state === "COMPLETED" ? "bg-brand-500 text-black" : p.state === "FAILED" ? "bg-red-500/20 text-danger" : "bg-white/10 text-neutral-300"}`}>{p.state.toLowerCase()}</span></td>
                  <td className="break-all p-4 text-xs text-neutral-500">{p.merchantOrderId}{p.remarks ? <div className="mt-1 text-neutral-400">{p.remarks}</div> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
