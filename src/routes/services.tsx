import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  icon_name: string;
  features: string[];
  starts_at_price: number | null;
  order_index: number;
  is_visible: boolean;
};

const ICONS: Record<string, LucideIcon> = {
  Hash,
  Target,
  Search,
  Sparkles,
  Palette,
  BarChart,
};

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — LetUsGrow" },
      {
        name: "description",
        content:
          "Social, paid, SEO, branding, design and analytics — engineered to compound revenue.",
      },
      { property: "og:title", content: "Services — LetUsGrow" },
      {
        property: "og:description",
        content: "Six disciplines, one operating system for growth.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [items, setItems] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("services")
        .select(
          "id, slug, title, short_description, icon_name, features, starts_at_price, order_index, is_visible",
        )
        .eq("is_visible", true)
        .order("order_index", { ascending: true })
        .limit(50);
      if (!alive) return;
      if (error) console.error(error);
      setItems((data ?? []) as ServiceRow[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="What we do"
        title="Our Services"
        subtitle="Pick a single discipline or run the full stack. Every engagement is built around measurable revenue outcomes."
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
        {loading ? (
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-7 animate-pulse h-80" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center">
            <h3 className="text-2xl font-display font-semibold">Services coming soon</h3>
            <p className="mt-3 text-muted-foreground">
              Add services from the admin panel to populate this page.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => {
              const Icon = ICONS[s.icon_name] ?? Sparkles;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="group relative flex h-full flex-col overflow-hidden glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-glow hover:border-accent/50 transition-all"
                  >
                    <div
                      className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <span className="relative grid place-items-center h-14 w-14 rounded-2xl bg-gradient-primary shadow-glow">
                      <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.25} />
                    </span>

                    <h3 className="relative mt-5 text-xl font-display font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">
                      {s.short_description}
                    </p>

                    {s.features && s.features.length > 0 && (
                      <ul className="relative mt-5 space-y-2">
                        {s.features.slice(0, 3).map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-foreground/85"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="relative mt-auto pt-6 flex items-end justify-between gap-3">
                      {s.starts_at_price != null && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Starts at
                          </div>
                          <div className="text-lg font-display font-semibold text-gradient">
                            ${s.starts_at_price.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </div>
                        </div>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Learn More
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-20">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-8 sm:p-12 text-center shadow-glow">
            <div aria-hidden className="absolute inset-0 bg-hero-radial opacity-70" />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">
                Need a custom service?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                If your challenge doesn't fit a box, we'll build a bespoke engagement around your goals.
              </p>
              <Link
                to="/contact"
                className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
              >
                Contact us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
