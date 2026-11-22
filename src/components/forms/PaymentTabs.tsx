"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PaymentForm from "@/components/forms/PaymentForm";
import InvoicePortal from "@/components/forms/InvoicePortal";

const tabs = [
  { id: "quick", label: "Pay one invoice" },
  { id: "invoices", label: "My invoices (login)" },
] as const;

export default function PaymentTabs() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("quick");
  useEffect(() => {
    // Links we send customers open straight on the login tab.
    if (new URLSearchParams(window.location.search).get("tab") !== "invoices") return;
    const t = setTimeout(() => setTab("invoices"), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="mb-6 flex gap-1.5 rounded-full border border-white/10 bg-ink-900 p-1.5" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors sm:text-base ${tab === t.id ? "text-black" : "text-neutral-300 hover:text-white"}`}>
            {tab === t.id && <motion.span layoutId="pay-tab" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      {tab === "quick" ? <PaymentForm /> : <InvoicePortal />}
    </div>
  );
}
