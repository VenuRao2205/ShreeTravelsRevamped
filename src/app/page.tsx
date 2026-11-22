export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-900 text-white">
      <div className="container-page text-center">
        <h1 className="font-display text-4xl sm:text-6xl">Shree Travels</h1>
        <p className="mt-4 text-lg text-primary-200">
          Corporate car rental in Nagpur &mdash; 30+ years of trusted service.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="tel:+919822236802" className="btn-accent">
            Call Now
          </a>
          <a href="/contact" className="btn-outline">
            Request a Quote
          </a>
        </div>
      </div>
    </main>
  );
}
