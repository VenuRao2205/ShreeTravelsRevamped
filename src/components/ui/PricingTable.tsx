import data from "@/data/pricing.json";
import { Fade } from "@/components/ui/motion";

type Rates = Record<string, number | null>;

const inr = new Intl.NumberFormat("en-IN");
const updated = new Date(data.updated).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function PricingTable() {
  // Hide a car entirely if no row offers it, so an unused column never shows.
  const vehicles = data.vehicles.filter((v) => data.rows.some((r) => (r.rates as Rates)[v.id] != null));

  return (
    <div>
      <Fade>
        <div className="relative overflow-x-auto rounded-3xl border border-white/10 bg-ink-900">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">Car rental rates in Nagpur, in rupees</caption>
            <thead>
              <tr className="bg-brand-500 text-black">
                <th scope="col" className="sticky left-0 z-10 bg-brand-500 p-4 font-display text-lg font-extrabold sm:p-5">
                  Car
                </th>
                {vehicles.map((v) => (
                  <th key={v.id} scope="col" className="whitespace-nowrap p-4 text-right font-display text-lg font-extrabold sm:p-5">
                    {v.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.label} className="group border-t border-white/10 transition-colors hover:bg-brand-500/10">
                  <th scope="row" className="sticky left-0 z-10 bg-ink-900 p-4 align-top font-semibold transition-colors group-hover:bg-[#1f1308] sm:p-5">
                    <span className="block text-white">{row.label}</span>
                    <span className="block text-sm font-normal text-neutral-500">{row.unit}</span>
                  </th>
                  {vehicles.map((v) => {
                    const rate = (row.rates as Rates)[v.id];
                    return (
                      <td key={v.id} className="whitespace-nowrap p-4 text-right align-top tabular-nums sm:p-5">
                        {rate == null ? (
                          <span className="text-neutral-600" aria-label="Not offered">&ndash;</span>
                        ) : (
                          <span className="font-display text-lg font-bold text-white transition-colors group-hover:text-brand-400">
                            &#8377;{inr.format(rate)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fade>
      <ul className="mt-6 space-y-2 text-neutral-400">
        {data.notes.map((n) => (
          <li key={n} className="max-w-3xl">{n}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-neutral-500">Rates last updated {updated}.</p>
    </div>
  );
}
