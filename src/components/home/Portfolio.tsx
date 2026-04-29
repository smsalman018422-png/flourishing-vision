import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ImageOff, MoveHorizontal, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Item = Tables<"portfolio">;

const FILTERS = ["All", "Social Media", "Paid Ads", "SEO", "Branding", "Design"] as const;
type Filter = (typeof FILTERS)[number];

const PAGE = 6;

/* -------- before/after slider -------- */

function BeforeAfter({ before, after }: { before: string | null; after: string | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, p)));
  };

  useEffect(() => {
    const up = () => (dragging.current = false);
    const mv = (e: PointerEvent) => dragging.current && move(e.clientX);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", mv);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", mv);
    };
  }, []);

  if (!before || !after) {
    return (
      <div className="aspect-video w-full rounded-2xl glass grid place-items-center text-muted-foreground">
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative aspect-video w-full overflow-hidden rounded-2xl select-none cursor-ew-resize touch-none"
      onPointerDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
    >
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before"
          className="h-full w-full object-cover"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
          loading="lazy"
        />
      </div>

      {/* labels */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-background/70 backdrop-blur">
        BEFORE
      </span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/90 text-accent-foreground">
        AFTER
      </span>

      {/* divider + handle */}
      <div
        className="absolute top-0 bottom-0 w-px bg-accent shadow-glow pointer-events-none"
        style={{ left: `${pos}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 grid place-items-center h-10 w-10 rounded-full bg-gradient-primary shadow-glow"
        style={{ left: `${pos}%` }}
      >
        <MoveHorizontal className="h-4 w-4 text-primary-foreground" />
      </div>
    </div>
  );
}

/* -------- modal -------- */

function CaseStudyModal({ item, onClose }: { item: Item; onClose: () => void }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stats = [
    { v: item.roi_pct != null ? `${item.roi_pct}%` : null, l: "ROI" },
    { v: item.revenue_label, l: "Revenue" },
    { v: item.growth_pct != null ? `+${item.growth_pct}%` : null, l: "Growth" },
  ].filter((s) => s.v);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className="relative mx-auto max-w-4xl glass-strong rounded-3xl overflow-hidden shadow-glow my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 grid place-items-center h-10 w-10 rounded-full glass hover:bg-destructive/20 hover:scale-105 active:scale-95 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {item.cover_image_url && (
          <div className="relative aspect-[16/7] w-full overflow-hidden">
            <img src={item.cover_image_url} alt={item.project_title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/90 text-accent-foreground">
                {item.category}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{item.client_name}</div>
              <h3 className="mt-1 text-3xl sm:text-4xl font-display font-bold tracking-tight">{item.project_title}</h3>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-10">
          {stats.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.l} className="glass rounded-xl p-5 text-center">
                  <div className="text-3xl sm:text-4xl font-display font-bold text-gradient">{s.v}</div>
                  <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: "Challenge", d: item.challenge },
              { t: "Solution", d: item.solution },
              { t: "Results", d: item.results },
            ].map(
              (b) =>
                b.d && (
                  <div key={b.t}>
                    <div className="text-xs uppercase tracking-wider text-accent font-semibold">{b.t}</div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{b.d}</p>
                  </div>
                )
            )}
          </div>

          {(item.before_image_url || item.after_image_url) && (
            <div>
              <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
                Before vs After
              </div>
              <BeforeAfter before={item.before_image_url} after={item.after_image_url} />
            </div>
          )}

          {item.testimonial_quote && (
            <figure className="glass rounded-2xl p-6 sm:p-8">
              <Quote className="h-6 w-6 text-accent" />
              <blockquote className="mt-3 text-lg leading-relaxed">
                &ldquo;{item.testimonial_quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{item.testimonial_author}</span>
                {item.testimonial_role && (
                  <span className="text-muted-foreground"> · {item.testimonial_role}</span>
                )}
              </figcaption>
            </figure>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------- card -------- */

function Card({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="group relative text-left glass rounded-2xl overflow-hidden hover:shadow-glow hover:border-accent/50 transition-all"
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
          <div className="h-full w-full bg-gradient-primary opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/90 text-accent-foreground shadow-glow">
          {item.category}
        </span>
      </div>

      <div className="p-5">
        <div className="text-xs text-muted-foreground">{item.client_name}</div>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">{item.project_title}</h3>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: item.roi_pct != null ? `${item.roi_pct}%` : "—", l: "ROI" },
            { v: item.revenue_label ?? "—", l: "Revenue" },
            { v: item.growth_pct != null ? `+${item.growth_pct}%` : "—", l: "Growth" },
          ].map((s) => (
            <div key={s.l} className="glass rounded-lg py-2">
              <div className="text-sm font-semibold text-gradient leading-none">{s.v}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
          View Case Study
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  );
}

/* -------- main section -------- */

export function Portfolio() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [visible, setVisible] = useState(PAGE);
  const [active, setActive] = useState<Item | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (error) console.error(error);
      setItems(data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  useEffect(() => setVisible(PAGE), [filter]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const empty = !loading && filtered.length === 0;

  return (
    <section id="work" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Selected work</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
              Outcomes our clients <span className="text-gradient">brag about</span>.
            </h2>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-10 flex flex-wrap items-center gap-1 sm:gap-2 glass rounded-2xl p-1.5 w-fit">
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-2 text-sm rounded-xl transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="filter-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-card/70 border border-glass-border"
                  />
                )}
                <span className="relative">{f}</span>
                {isActive && (
                  <motion.span
                    layoutId="filter-underline"
                    className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-primary shadow-glow"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid / states */}
        <div className="mt-10">
          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted/30" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-1/3 bg-muted/40 rounded" />
                    <div className="h-5 w-2/3 bg-muted/40 rounded" />
                    <div className="h-12 bg-muted/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {empty && (
            <div className="glass-strong rounded-3xl p-12 text-center">
              <h3 className="text-2xl font-display font-semibold">Portfolio coming soon</h3>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Book a call to see private case studies tailored to your category.
              </p>
              <a
                href="#contact"
                className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
              >
                Book a strategy call <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {!loading && !empty && (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((item) => (
                  <Card key={item.id} item={item} onOpen={() => setActive(item)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl glass font-medium hover:bg-muted/40 hover:-translate-y-0.5 transition-all"
              >
                Load More
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {active && <CaseStudyModal item={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}
