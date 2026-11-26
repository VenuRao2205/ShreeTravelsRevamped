export const site = {
  name: "Shree Travels",
  phone: "+91 9822236802",
  phoneShort: "98222 36802",
  phoneHref: "tel:+919822236802",
  email: "shreetravelsngp@yahoo.com",
  address: "Plot No. 1066, Near Law College Square, Gorepeth, Nagpur - 440010",
  city: "Nagpur, Maharashtra",
  hours: "Mon-Sat: 10:00 AM - 10:00 PM",
  since: 1994,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shreetravelsnagpur.com",
  // Google Business Profile links. Set the env vars in Netlify to use your exact listing.
  googleMaps:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ??
    "https://www.google.com/maps/search/?api=1&query=Shree+Travels+Gorepeth+Nagpur",
  googleReview: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Rates" },
  { href: "/reviews", label: "Reviews" },
  { href: "/payment", label: "Pay online" },
  { href: "/contact", label: "Contact" },
];

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/cancellation", label: "Cancellation & Refund" },
];

export const services = [
  {
    slug: "corporate-car-rental",
    title: "Corporate car rental",
    blurb: "Hourly, daily and monthly cars with professional chauffeurs, billed to your company.",
    points: ["Hourly, daily and monthly options", "Hatchback to MUV", "Professional chauffeurs", "Competitive pricing"],
  },
  {
    slug: "employee-transportation",
    title: "Employee transportation",
    blurb: "Daily commute for your team on planned routes and fixed schedules.",
    points: ["Customised route planning", "Group transportation", "Regular schedule maintained", "Cost-effective packages"],
  },
  {
    slug: "airport-transfers",
    title: "Airport transfers",
    blurb: "Pickup and drop for business travellers, at any hour.",
    points: ["24/7 availability", "Flight tracking", "Meet and greet", "Luggage assistance"],
  },
  {
    slug: "executive-travel",
    title: "Executive travel",
    blurb: "Comfortable cars and experienced drivers for senior staff and guests.",
    points: ["Premium vehicle options", "Experienced chauffeurs", "Confidentiality assured", "Flexible scheduling"],
  },
  {
    slug: "event-transportation",
    title: "Event transportation",
    blurb: "Several cars coordinated around your conference or corporate event.",
    points: ["Group coordination", "Multiple vehicles deployed", "Synced to the event schedule", "Dedicated support team"],
  },
  {
    slug: "support",
    title: "24/7 support",
    blurb: "A phone line that is answered when your plans change.",
    points: ["Emergency assistance", "Booking changes", "Customer care hotline", "Real-time updates"],
  },
] as const;

export const serviceNames = services.map((s) => s.title);

export const fleetTypes = [
  { id: "hatchback", name: "Hatchback", text: "City rides and short distances." },
  { id: "sedan", name: "Sedan", text: "Business meetings and airport transfers." },
  { id: "muv", name: "MUV", text: "Group travel and executive transport." },
] as const;

export const fleet = [
  { type: "hatchback", name: "Tata Tigor", image: "/cars/tigor.webp", seats: "4 passengers" },
  { type: "sedan", name: "Toyota Etios", image: "/cars/etios.webp", seats: "4 passengers" },
  { type: "sedan", name: "Maruti Swift Dzire", image: "/cars/dzire.webp", seats: "4 passengers" },
  { type: "muv", name: "Toyota Innova Crysta", image: "/cars/crysta.webp", seats: "6-7 passengers" },
  { type: "muv", name: "Toyota Innova Hycross", image: "/cars/hycross.webp", seats: "6-7 passengers" },
  { type: "muv", name: "Kia Carens", image: "/cars/carens.webp", seats: "6-7 passengers" },
] as const;

export const stats = [
  { value: 30, suffix: "+", label: "years on Nagpur's roads" },
  { value: 10000, suffix: "+", label: "customers driven" },
  { value: 24, suffix: "/7", label: "dispatch line" },
] as const;
