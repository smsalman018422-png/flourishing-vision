import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Calendar, ArrowUpRight } from "lucide-react";

const posts = [
  { slug: "compounding-growth", title: "Compounding growth beats heroic launches", date: "Apr 2026", excerpt: "Why steady, instrumented improvement outperforms quarterly stunts every time." },
  { slug: "creative-testing-frameworks", title: "Creative testing frameworks that actually scale", date: "Mar 2026", excerpt: "A pragmatic system for testing ad creative without burning your budget." },
  { slug: "seo-revenue-not-traffic", title: "Forecast SEO in revenue, not traffic", date: "Feb 2026", excerpt: "Stop reporting sessions. Start reporting EBITDA contribution." },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — LetUsGrow" },
      { name: "description", content: "Field notes from senior operators on growth, brand, and engineering." },
      { property: "og:title", content: "Blog — LetUsGrow" },
      { property: "og:description", content: "Field notes from senior operators." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="Field notes" title="Writing from the people doing the work" subtitle="No thought leadership theatre. Just lessons from real engagements." />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glow transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {p.date}
              </div>
              <h2 className="mt-4 text-lg font-display font-semibold leading-snug">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
