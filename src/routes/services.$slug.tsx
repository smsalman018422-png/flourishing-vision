import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Hash,
  Target,
  Search,
  Sparkles,
  Palette,
  BarChart,
  ImageOff,
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { getServiceBySlug, getRelatedPortfolio } from "@/server/services.functions";

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string | null;
  icon_name: string;
  features: string[];
  process: { title: string; desc: string }[];
  packages: { name: string; price: number; features: string[] }[];
  starts_at_price: number | null;
  service_type: string | null;
};

type PortfolioRow = {
  id: string;
  client_name: string;
  project_title: string;
  category: string;
  cover_image_url: string | null;
  roi_pct: number | null;
};

const ICONS: Record<string, LucideIcon> = {
  Hash,
  Target,
  Search,
  Sparkles,
  Palette,
  BarChart,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const data = await getServiceBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data as ServiceRow;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — LetUsGrow` },
          { name: "description", content: loaderData.short_description },
          { property: "og:title", content: `${loaderData.title} — LetUsGrow` },
          { property: "og:description", content: loaderData.short_description },
        ]
      : [{ title: "Service — LetUsGrow" }],
  }),
  component: ServiceDetail,
  errorComponent: ({ error }) => (
    <PageShell>
      <PageHeader title="Something went wrong" subtitle={error.message} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <Link to="/services" className="text-primary underline-offset-4 hover:underline">
          ← All services
        </Link>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 pb-24 text-center">
        <div className="text-7xl sm:text-9xl font-display font-bold text-gradient">404</div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-display font-semibold">
          Service not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find that service. It may have been renamed or moved.
        </p>
        <Link
          to="/services"
          className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
        >
          ← Back to all services
        </Link>
      </section>
    </PageShell>
  ),
});

function ServiceDetail() {
  const data = Route.useLoaderData();
  const Icon = ICONS[data.icon_name] ?? Sparkles;

  const [related, setRelated] = useState<PortfolioRow[]>([]);
  useEffect(() => {
    if (!data.service_type) return;
    let alive = true;
    getRelatedPortfolio({ data: { serviceType: data.service_type as string } })
      .then((rows) => {
        if (alive) setRelated((rows ?? []) as PortfolioRow[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [data.service_type]);

  const process: { title: string; desc: string }[] = Array.isArray(data.process) ? (data.process as { title: string; desc: string }[]) : [];
  const packages: { name: string; price: number; features: string[] }[] = Array.isArray(data.packages) ? (data.packages as { name: string; price: number; features: string[] }[]) : [];
  const features: string[] = Array.isArray(data.features) ? (data.features as string[]) : [];

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-16 sm:pt-16 sm:pb-24">
        <div aria-hidden className="absolute inset-x-0 -top-20 h-64 bg-hero-radial pointer-events-none" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All services
            </Link>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-primary shadow-glow">
                <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.25} />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary">
                Service
              </span>
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight">
              {data.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl">
              {data.long_description ?? data.short_description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              {data.starts_at_price != null && (
                <span className="inline-flex items-center h-12 px-5 rounded-xl glass text-sm">
                  Starts at{" "}
                  <span className="ml-1.5 font-semibold text-gradient">
                    ${data.starts_at_price.toLocaleString()}/mo
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      {features.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="glass-strong rounded-3xl p-6 sm:p-10">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Included</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              What's included
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-xl glass p-4"
                >
                  <span className="mt-0.5 grid place-items-center h-6 w-6 rounded-full bg-primary/15 text-primary shrink-0">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm sm:text-base text-foreground/90 leading-snug">{f}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* PROCESS */}
      {process.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Process</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              How we deliver
            </h2>
          </div>

          <div className="mt-12 relative">
            {/* connecting line desktop */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            <div className="grid gap-10 lg:gap-6 lg:grid-cols-4">
              {process.map((step, i) => (
                <motion.div
                  key={step.title + i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex lg:flex-col items-start lg:items-center gap-4 lg:text-center"
                >
                  <div className="relative shrink-0 z-10">
                    <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
                    <div className="relative grid place-items-center h-16 w-16 rounded-full bg-background border-2 border-primary text-lg font-display font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="lg:mt-6">
                    <h3 className="text-lg font-display font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed lg:max-w-[220px] lg:mx-auto">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      {packages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Pricing</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Choose your tier
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:gap-6 md:grid-cols-3">
            {packages.map((pkg, i) => {
              const featured = i === 1;
              return (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`relative rounded-2xl p-7 ${
                    featured
                      ? "glass-strong border-2 border-primary/40 shadow-glow lg:scale-[1.03]"
                      : "glass"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[11px] font-semibold shadow-glow">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="text-xl font-display font-semibold tracking-tight">
                    {pkg.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-display font-bold text-gradient">
                      ${Number(pkg.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {(pkg.features ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 text-primary shrink-0" strokeWidth={3} />
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all ${
                      featured
                        ? "bg-gradient-primary text-primary-foreground shadow-glow hover:-translate-y-0.5"
                        : "glass hover:bg-muted/40"
                    }`}
                  >
                    Choose {pkg.name} <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* RELATED CASE STUDIES */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <p className="text-sm font-medium text-accent uppercase tracking-wider">Proof</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight">
                Related case studies
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
            >
              View all work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => {
              const slug = slugify(`${p.client_name}-${p.project_title}`);
              return (
                <Link
                  key={p.id}
                  to="/portfolio/$slug"
                  params={{ slug }}
                  className="group glass rounded-2xl overflow-hidden hover:shadow-glow hover:border-accent/50 hover:-translate-y-1 transition-all"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.project_title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-primary opacity-50 grid place-items-center">
                        <ImageOff className="h-8 w-8 text-primary-foreground/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/90 text-accent-foreground">
                      {p.category}
                    </span>
                    {p.roi_pct != null && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-md text-xs font-bold bg-background/80 backdrop-blur text-gradient">
                        {p.roi_pct}% ROI
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground">{p.client_name}</div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">
                      {p.project_title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center shadow-glow border border-primary/30"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.46 0.13 152) 0%, oklch(0.62 0.16 150) 50%, oklch(0.82 0.19 145) 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-primary-foreground">
              Ready to start?
            </h2>
            <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
              Book a free 30-minute strategy call. We'll diagnose, recommend, and quote — no pitch deck.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-background text-foreground font-semibold shadow-2xl hover:bg-background/95 transition-colors"
            >
              Book a call <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
