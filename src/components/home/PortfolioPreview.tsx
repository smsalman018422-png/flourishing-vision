import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { subscribeToTable } from "@/lib/realtime";

type Item = Tables<"portfolio">;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PortfolioPreview() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadItems = async () => {
      // Try featured first
      const { data: featured } = await supabase
        .from("portfolio")
        .select("*")
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(3);

      let list = featured ?? [];
      // Fallback: if no featured items yet, show first 3 by sort order
      if (list.length === 0) {
        const { data: any3 } = await supabase
          .from("portfolio")
          .select("*")
          .order("sort_order", { ascending: true })
          .limit(3);
        list = any3 ?? [];
      }

      if (alive) {
        setItems(list);
        setLoading(false);
      }
    };
    loadItems();
    const unsubscribe = subscribeToTable("portfolio", loadItems, "home-portfolio-changes");
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Featured work</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
              Brands we've helped <span className="text-gradient">scale</span>.
            </h2>
          </div>
          <Link
            to="/portfolio"
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-xl glass font-medium hover:bg-muted/40 hover:-translate-y-0.5 transition-all"
          >
            View All Work <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-muted/30" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 bg-muted/40 rounded" />
                  <div className="h-5 w-2/3 bg-muted/40 rounded" />
                </div>
              </div>
            ))}

          {!loading &&
            items.map((item, i) => {
              const slug = slugify(`${item.client_name}-${item.project_title}`);
              const metric =
                item.roi_pct != null
                  ? `${item.roi_pct}% ROI`
                  : item.growth_pct != null
                  ? `+${item.growth_pct}% Growth`
                  : item.revenue_label ?? "Case Study";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link
                    to="/portfolio/$slug"
                    params={{ slug }}
                    className="group block glass rounded-2xl overflow-hidden hover:shadow-glow hover:border-accent/50 hover:-translate-y-1 transition-all"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.project_title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-primary opacity-50 grid place-items-center">
                          <ImageOff className="h-8 w-8 text-primary-foreground/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/90 text-accent-foreground shadow-glow">
                        {item.category}
                      </span>
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-md text-xs font-bold bg-background/80 backdrop-blur text-gradient">
                        {metric}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="text-xs text-muted-foreground">{item.client_name}</div>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">
                        {item.project_title}
                      </h3>
                      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
                        View case study
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

          {!loading && items.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 glass-strong rounded-3xl p-12 text-center">
              <h3 className="text-2xl font-display font-semibold">Featured work coming soon</h3>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                We're curating our best case studies. Check back soon or book a call to see private examples.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex sm:hidden justify-center">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl glass font-medium"
          >
            View All Work <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
