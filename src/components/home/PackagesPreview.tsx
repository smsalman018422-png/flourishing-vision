import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Pkg = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  price_monthly: number;
  is_popular: boolean;
  cta_text: string | null;
  order_index: number;
};

export function PackagesPreview() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("packages")
        .select("id, name, slug, tagline, price_monthly, is_popular, cta_text, order_index")
        .eq("is_visible", true)
        .order("order_index", { ascending: true })
        .limit(4);
      if (active) {
        setPackages((data as Pkg[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Packages</p>
          <h2 className="mt-3 inline-block text-4xl sm:text-5xl font-bold tracking-tight relative">
            Our Packages
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute left-0 -bottom-2 h-1 w-full origin-left rounded-full bg-gradient-primary shadow-glow"
            />
          </h2>
          <p className="mt-6 text-muted-foreground">
            Pick the membership that matches your stage. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-7 h-64 animate-pulse" />
              ))
            : packages.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                  whileHover={{ y: -8 }}
                >
                  <Link
                    to="/pricing"
                    className={`group relative block h-full glass rounded-2xl p-7 overflow-hidden transition-all duration-300 hover:border-accent/60 hover:shadow-glow hover:bg-card/40 ${
                      p.is_popular ? "border-accent/60 shadow-glow" : ""
                    }`}
                  >
                    {p.is_popular && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        <Sparkles className="h-3 w-3" /> Popular
                      </span>
                    )}
                    <div className="relative">
                      <h3 className="text-xl font-semibold tracking-tight">{p.name}</h3>
                      {p.tagline && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {p.tagline}
                        </p>
                      )}
                      <div className="mt-5">
                        <span className="text-3xl font-display font-bold text-gradient">
                          ${Number(p.price_monthly).toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground"> /mo</span>
                      </div>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
                        {p.cta_text || "Choose Plan"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
          >
            View All Packages <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
