export default function Marquee({ items }: { items: readonly string[] }) {
  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t}
          <span className="text-black/40">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-brand-500 py-4 text-black" role="presentation">
      <span className="sr-only">{items.join(", ")}</span>
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row}
        {row}
      </div>
    </div>
  );
}
