import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { ReviewForm, ReviewsWall } from "@/components/forms/Reviews";
import { Fade } from "@/components/ui/motion";

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
              <h2 className="mb-6 text-3xl">Share your experience</h2>
              <ReviewForm />
            </Fade>
          </div>
        </div>
      </section>
    </main>
  );
}
