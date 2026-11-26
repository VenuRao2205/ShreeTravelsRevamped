"use client";

import { useState } from "react";
import { BarChart3, FileText, Scale } from "lucide-react";
import BillsList, { type BillRow } from "@/components/admin/Bills";
import { MisReport, RcmRegister, Tile, periodFor, useReport, type Period } from "@/components/admin/BillingReports";
import { inr } from "@/lib/billing";
import type { Range } from "@/components/admin/Filters";

type Sub = "bills" | "mis" | "rcm";
const SUBS: { id: Sub; label: string; icon: typeof FileText }[] = [
  { id: "bills", label: "Bills", icon: FileText },
  { id: "mis", label: "MIS reports", icon: BarChart3 },
  { id: "rcm", label: "RCM register", icon: Scale },
];

/** The billing workspace: make bills, see the MIS reports and the reverse-charge register. */
export default function Billing({ range, onUnauthorized, onMakeLink }: { range: Range; onUnauthorized: () => void; onMakeLink: (b: BillRow) => void }) {
  const [sub, setSub] = useState<Sub>("bills");
  const [period, setPeriod] = useState<Period>(() => periodFor("month"));
  const month = useReport(periodFor("month"), onUnauthorized);
  const t = month.data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Billing">
        {SUBS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={sub === id} onClick={() => setSub(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${sub === id ? "border-brand-500 bg-brand-500 text-black" : "border-white/20 text-neutral-300 hover:border-brand-500 hover:text-white"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {sub === "bills" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="This month">
            <Tile label="Invoices this month" value={t ? String(t.invoices) : "-"} />
            <Tile label="Billed this month" value={t ? inr(t.total) : "-"} />
            <Tile label="GST charged" value={t ? inr(t.gst) : "-"} />
            <Tile label="GST paid by customers (RCM)" value={t ? inr(t.rcmTax) : "-"} />
          </div>
          <BillsList range={range} onUnauthorized={onUnauthorized} onMakeLink={onMakeLink} />
        </>
      )}
      {sub === "mis" && <MisReport period={period} setPeriod={setPeriod} onUnauthorized={onUnauthorized} customers={[]} />}
      {sub === "rcm" && <RcmRegister period={period} setPeriod={setPeriod} onUnauthorized={onUnauthorized} customers={[]} />}
    </div>
  );
}
