import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Play, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToTable } from "@/lib/realtime";

type Testimonial = {
  id: string;
  author_name: string;
  author_role: string;
  company: string;
  quote: string;
  rating: number;
  photo_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
};

const AUTOPLAY_MS = 5000;

export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [video, setVideo] = useState<Testimonial | null>(null);

  // Fetch
  useEffect(() => {
    let alive = true;
    const loadItems = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(50);
      if (alive) setItems((data ?? []) as Testimonial[]);
    };
    loadItems();
    const unsubscribe = subscribeToTable("testimonials", loadItems, "home-testimonials-changes");
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  // Responsive perView
  useEffect(() => {
    const compute = () => setPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const pageCount = Math.max(1, items.length - perView + 1);

  // Clamp index
  useEffect(() => {
    if (index > pageCount - 1) setIndex(0);
  }, [pageCount, index]);

  // Autoplay
  useEffect(() => {
    if (paused || items.length <= perView || video) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % pageCount);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, items.length, perView, pageCount, video]);

  const trackRef = useRef<HTMLDivElement>(null);

  const next = () => setIndex((i) => (i + 1) % pageCount);
  const prev = () => setIndex((i) => (i - 1 + pageCount) % pageCount);

  const avgRating = useMemo(() => {
    if (!items.length) return 4.9;
    return Math.round((items.reduce((a, b) => a + b.rating, 0) / items.length) * 10) / 10;
  }, [items]);

  return (
    <section id="testimonials" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-[0.3em]">Testimonials</p>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            What Our <span className="text-primary">Clients Say</span>
          </h2>

          {/* Trustpilot-style rating */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/60 backdrop-blur-xl px-4 py-2">
            <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="inline-flex h-6 w-6 items-center justify-center bg-primary rounded-sm">
                  <Star className="h-4 w-4 text-primary-foreground fill-primary-foreground" strokeWidth={0} />
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Excellent</span> · {items.length || 500}+ reviews
            </span>
          </div>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative mt-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden" ref={trackRef}>
            <motion.div
              className="flex"
              animate={{ x: `-${index * (100 / perView)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            >
              {items.map((t) => (
                <div
                  key={t.id}
                  className="shrink-0 px-3"
                  style={{ width: `${100 / perView}%` }}
                >
                  <Card t={t} onPlay={() => setVideo(t)} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Arrows */}
          {items.length > perView && (
            <>
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-card/70 backdrop-blur-xl border border-border/60 hover:border-primary/60 hover:text-primary transition shadow-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-card/70 backdrop-blur-xl border border-border/60 hover:border-primary/60 hover:text-primary transition shadow-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {pageCount > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {video && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVideo(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border/60 bg-black shadow-2xl"
            >
              <button
                onClick={() => setVideo(null)}
                aria-label="Close video"
                className="absolute right-4 top-4 z-10 rounded-full p-2 bg-background/60 hover:bg-background border border-border transition"
              >
                <X className="h-4 w-4" />
              </button>
              <video
                src={video.video_url ?? ""}
                poster={video.video_thumbnail_url ?? undefined}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Card({ t, onPlay }: { t: Testimonial; onPlay: () => void }) {
  const isVideo = !!t.video_url;

  return (
    <div className="group relative h-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-8 hover:border-primary/40 hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.5)] transition-all duration-300">
      {isVideo && (
        <button
          onClick={onPlay}
          className="relative block w-full aspect-video rounded-xl overflow-hidden mb-5 group/video"
          aria-label={`Play video testimonial from ${t.author_name}`}
        >
          <img
            src={t.video_thumbnail_url ?? ""}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/video:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl group-hover/video:scale-110 transition-transform">
              <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
              <Play className="relative h-6 w-6 fill-current ml-1" />
            </span>
          </div>
        </button>
      )}

      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < t.rating ? "text-primary fill-primary" : "text-muted"}`}
            strokeWidth={0}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-base md:text-lg leading-relaxed text-foreground/90">
        <span className="text-primary font-serif text-3xl leading-none mr-1">“</span>
        {t.quote}
      </p>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3 pt-5 border-t border-border/40">
        <img
          src={t.photo_url ?? ""}
          alt={t.author_name}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div>
          <div className="font-semibold">{t.author_name}</div>
          <div className="text-sm text-muted-foreground">
            {t.author_role} · <span className="text-primary">{t.company}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
