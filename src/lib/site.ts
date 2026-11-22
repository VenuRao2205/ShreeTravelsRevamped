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
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://shreetravelsngp.netlify.app",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
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
    points: ["Hourly, daily and monthly options", "Hatchback to SUV", "Professional chauffeurs", "Competitive pricing"],
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

export const vehicles = [
  { name: "Hatchback", image: "/images/car1.webp", seats: "4 passengers", text: "City rides and short distances.", tags: ["AC", "GPS", "Professional driver"] },
  { name: "Sedan", image: "/images/car2.webp", seats: "4 passengers", text: "Business meetings and airport transfers.", tags: ["AC", "GPS", "Professional driver", "Spacious"] },
  { name: "SUV", image: "/images/car3.webp", seats: "6-7 passengers", text: "Group travel and executive transport.", tags: ["AC", "GPS", "Professional driver", "Premium comfort"] },
] as const;

export const stats = [
  { value: 30, suffix: "+", label: "years on Nagpur's roads" },
  { value: 10000, suffix: "+", label: "customers driven" },
  { value: 24, suffix: "/7", label: "dispatch line" },
] as const;
