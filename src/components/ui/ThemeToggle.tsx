"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  // Read what the head script already applied, so the icon matches without a flash.
  useEffect(() => {
    const t = setTimeout(() => setDark(document.documentElement.classList.contains("dark")), 0);
    return () => clearTimeout(t);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light grey theme" : "Switch to black theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={`grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-brand-500 hover:text-accent ${className}`}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
