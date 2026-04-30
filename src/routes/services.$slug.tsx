import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Check, ArrowRight } from "lucide-react";

const detail: Record<string, { title: string; tagline: string; bullets: string[] }> = {
  "social-media": {
    title: "Social Media",
    tagline: "Always-on content that earns attention and pipeline.",
    bullets: ["Channel strategy & tone of voice", "Monthly content calendars", "Short-form video production", "Community management", "Reporting against revenue, not vanity"],
  },
  "paid-ads": {
    title: "Paid Ads",
    tagline: "Performance media that compounds across Meta, Google, TikTok and LinkedIn.",
    bullets: ["Account audit & restructuring", "Creative testing frameworks", "Audience & feed optimisation", "MMM-aware budget allocation", "Weekly readouts with the buyer in the room"],
  },
  seo: {
    title: "SEO",
    tagline: "Technical, content, and authority work — ranked for the queries that pay.",
    bullets: ["Crawl & Core Web Vitals", "Topical authority planning", "Programmatic & editorial content", "Digital PR & link earning", "Forecasted revenue, not traffic"],
  },
  branding: {
    title: "Branding",
    tagline: "Identity systems people remember and teams can actually ship.",
    bullets: ["Positioning & narrative", "Visual identity & guidelines", "Verbal identity & messaging", "Launch toolkits", "Brand-to-performance alignment"],
  },
  design: {
    title: "Design",
    tagline: "Web, product, and campaign design with conversion baked in.",
    bullets: ["Site & landing page design", "Design systems in code", "Conversion experimentation", "Motion & interaction", "Accessibility from the start"],
  },
  analytics: {
    title: "Analytics",
    tagline: "Tracking, dashboards, and decisions you can defend.",
    bullets: ["GA4 / server-side tracking", "Attribution modelling", "Looker Studio dashboards", "Experiment design", "Weekly insight memos"],
  },
};

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const item = detail[params.slug];
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — LetUsGrow` },
          { name: "description", content: loaderData.tagline },
          { property: "og:title", content: `${loaderData.title} — LetUsGrow` },
          { property: "og:description", content: loaderData.tagline },
        ]
      : [{ title: "Service — LetUsGrow" }],
  }),
  component: ServiceDetail,
  notFoundComponent: () => (
    <PageShell>
      <PageHeader title="Service not found" subtitle="That service doesn't exist (yet)." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <Link to="/services" className="text-primary underline-offset-4 hover:underline">← All services</Link>
      </div>
    </PageShell>
  ),
});

function ServiceDetail() {
  const data = Route.useLoaderData();
  return (
    <PageShell>
      <PageHeader eyebrow="Service" title={data.title} subtitle={data.tagline} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-display font-semibold">What's included</h2>
          <ul className="mt-6 space-y-3">
            {data.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
                <span className="mt-0.5 grid place-items-center h-5 w-5 rounded-full bg-primary/20 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8 flex flex-col">
          <h2 className="text-lg font-display font-semibold">Ready to talk?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Free 30-minute strategy call. No deck, no fluff.</p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
          >
            Book a call <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/services" className="mt-4 text-xs text-muted-foreground hover:text-foreground transition">← All services</Link>
        </div>
      </section>
    </PageShell>
  );
}
