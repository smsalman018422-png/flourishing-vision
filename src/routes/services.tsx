import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { ArrowUpRight, Search, Megaphone, Palette, Code, BarChart3, Sparkles } from "lucide-react";

const services = [
  { slug: "social-media", title: "Social Media", desc: "Always-on content engines that build audience and pipeline.", Icon: Sparkles },
  { slug: "paid-ads", title: "Paid Ads", desc: "Performance budgets that compound — Meta, Google, TikTok, LinkedIn.", Icon: Megaphone },
  { slug: "seo", title: "SEO", desc: "Technical, content, and authority work that ranks for revenue.", Icon: Search },
  { slug: "branding", title: "Branding", desc: "Identity systems people remember and teams can ship.", Icon: Palette },
  { slug: "design", title: "Design", desc: "Web, product, and campaign design with conversion in mind.", Icon: Code },
  { slug: "analytics", title: "Analytics", desc: "Tracking, dashboards, and decisions you can defend.", Icon: BarChart3 },
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — LetUsGrow" },
      { name: "description", content: "Social, paid, SEO, branding, design and analytics — engineered to compound revenue." },
      { property: "og:title", content: "Services — LetUsGrow" },
      { property: "og:description", content: "Six disciplines, one operating system for growth." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="What we do"
        title="Services that compound, not campaigns that decay"
        subtitle="Pick a single discipline or run the full stack. Either way, every engagement is built around measurable revenue outcomes."
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ slug, title, desc, Icon }) => (
            <Link
              key={slug}
              to="/services/$slug"
              params={{ slug }}
              className="group relative glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glow transition-all"
            >
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-primary shadow-glow">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <h3 className="mt-5 text-lg font-display font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Learn more <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
