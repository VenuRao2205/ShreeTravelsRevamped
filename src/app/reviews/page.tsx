import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { ReviewForm, ReviewsWall } from "@/components/forms/Reviews";
import { Fade } from "@/components/ui/motion";
import { ExternalLink, Star } from "lucide-react";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description: "What customers say about Shree Travels, and a place to share your own experience.",
};

export default function ReviewsPage() {
  return (
    <main>
      <PageHeader lines={["What riders", "say."]} intro="Real feedback from people who have travelled with us. Reviews appear after we approve them." />
      <section className="py-16 sm:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <ReviewsWall />
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Fade>
              <div className="mb-10 rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-8">
                <h2 className="text-2xl">Review us on Google</h2>
                <p className="mt-2 text-neutral-400">Travelled with us? A Google review helps other people in Nagpur find us.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {site.googleReview && (
                    <a href={site.googleReview} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <Star size={19} /> Write a Google review
                    </a>
                  )}
                  <a href={site.googleMaps} target="_blank" rel="noopener noreferrer" className={site.googleReview ? "btn-ghost" : "btn-primary"}>
                    <ExternalLink size={19} /> See us on Google Maps
                  </a>
                </div>
              </div>
              <h2 className="mb-6 text-3xl">Share your experience</h2>
              <ReviewForm />
            </Fade>
          </div>
        </div>
      </section>
    </main>
  );
}
