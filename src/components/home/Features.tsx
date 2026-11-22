import { Award, Car, Clock, Headphones, MapPin, Shield } from "lucide-react";

const features = [
  { icon: Award, title: "30+ Years Excellence", text: "Three decades serving Nagpur's businesses with consistent, dependable transport.", badge: "Since 1994" },
  { icon: Clock, title: "24/7 Availability", text: "Early flights, late shifts, last-minute plans: we are available when you need us.", badge: "Always on" },
  { icon: Shield, title: "Professional Drivers", text: "Experienced, courteous chauffeurs who know the city and put your safety first.", badge: "Verified" },
  { icon: Car, title: "Well-Maintained Fleet", text: "Hatchbacks, sedans and SUVs, regularly serviced and kept clean and comfortable.", badge: "Hatchback to SUV" },
  { icon: MapPin, title: "Local Expertise", text: "Deep knowledge of Nagpur's routes means faster, smoother and more punctual trips.", badge: "Nagpur" },
  { icon: Headphones, title: "Responsive Support", text: "A real person answers your call and sorts out changes without the runaround.", badge: "Call anytime" },
];

export default function Features() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="container-page">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 font-semibold uppercase tracking-wider text-primary-600">Why Shree Travels</p>
          <h2 className="font-display text-4xl sm:text-5xl">Built on trust, driven by service</h2>
          <p className="mt-5 text-lg text-gray-600">
            Corporate clients stay with us for years because we do the basics exceptionally well.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="card transition-transform duration-300 hover:-translate-y-2">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <f.icon size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
              <p className="mb-4 text-gray-600">{f.text}</p>
              <span className="inline-block rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-800">
                {f.badge}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
