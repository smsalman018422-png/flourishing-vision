import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Quote, X, TrendingUp } from "lucide-react";

type Project = {
  id: string;
  slug: string | null;
  client_name: string;
  project_title: string;
  category: string;
  service_type: string | null;
  cover_image_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  gallery_images: string[] | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  roi_pct: number | null;
  growth_pct: number | null;
  revenue_label: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
};

export const Route = createFileRoute("/portfolio/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Case study — ${params.slug} — Let Us Grow` },
      { name: "description", content: "A Let Us Grow case study: challenge, solution, and measurable results." },
      { property: "og:title", content: `Case study — ${params.slug}` },
      { property: "og:description", content: "Challenge, solution, results." },
    ],
  }),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-display font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Button asChild className="mt-6"><Link to="/portfolio">Back to portfolio</Link></Button>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-display font-semibold">Case study not found</h1>
        <p className="mt-3 text-muted-foreground">It may have moved or been unpublished.</p>
        <Button asChild className="mt-6"><Link to="/portfolio">Back to portfolio</Link></Button>
      </div>
    </PageShell>
  ),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try slug, fall back to id
      let { data } = await supabase.from("portfolio").select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const byId = await supabase.from("portfolio").select("*").eq("id", slug).maybeSingle();
        data = byId.data;
      }
      if (cancelled) return;
      if (!data) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setProject(data as Project);
      // related
      if (data.service_type) {
        const { data: rel } = await supabase
          .from("portfolio")
          .select("*")
          .eq("is_visible", true)
          .eq("service_type", data.service_type)
          .neq("id", data.id)
          .limit(3);
        if (!cancelled) setRelated((rel ?? []) as Project[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-32">
          <div className="h-12 w-2/3 rounded-lg glass animate-pulse" />
          <div className="mt-6 aspect-video rounded-2xl glass animate-pulse" />
        </div>
      </PageShell>
    );
  }

  if (missing || !project) {
    throw notFound();
  }

  const gallery = (project.gallery_images ?? []).filter(Boolean);
  if (gallery.length === 0) {
    if (project.before_image_url) gallery.push(project.before_image_url);
    if (project.after_image_url) gallery.push(project.after_image_url);
  }

  const metrics = [
    project.roi_pct != null && { label: "ROI", value: `${project.roi_pct}%` },
    project.revenue_label && { label: "Revenue", value: project.revenue_label },
    project.growth_pct != null && { label: "Growth", value: `+${project.growth_pct}%` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-10 sm:pt-8 sm:pb-16 relative">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> All case studies
          </Link>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {project.service_type && (
                <span className="inline-flex rounded-full glass px-3 py-1 text-xs font-medium text-primary">
                  {project.service_type.replace(/-/g, " ")}
                </span>
              )}
              <p className="mt-4 text-sm uppercase tracking-wider text-muted-foreground">{project.client_name}</p>
              <h1 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight">
                {project.project_title}
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-video rounded-2xl overflow-hidden glass"
            >
              {project.cover_image_url ? (
                <img src={project.cover_image_url} alt={project.project_title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      {metrics.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass rounded-2xl p-6 sm:p-8 text-center"
              >
                <div className="text-3xl sm:text-5xl font-display font-semibold text-primary">{m.value}</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Challenge / Solution / Results */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        {project.challenge && (
          <Block eyebrow="01 — Challenge" title="The challenge" body={project.challenge} />
        )}
        {project.solution && (
          <Block eyebrow="02 — Solution" title="Our approach" body={project.solution} />
        )}
        {project.results && (
          <Block eyebrow="03 — Results" title="What we delivered" body={project.results} />
        )}
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden glass"
              >
                <img src={url} alt={`Gallery ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Testimonial */}
      {project.testimonial_quote && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
          <div className="glass rounded-2xl p-8 sm:p-12 relative">
            <Quote className="absolute top-6 left-6 h-10 w-10 text-primary/20" />
            <p className="text-xl sm:text-2xl font-display leading-relaxed pl-12">"{project.testimonial_quote}"</p>
            {project.testimonial_author && (
              <div className="mt-6 pl-12">
                <p className="font-semibold">{project.testimonial_author}</p>
                {project.testimonial_role && (
                  <p className="text-sm text-muted-foreground">{project.testimonial_role}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Related projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/portfolio/$slug"
                params={{ slug: r.slug ?? r.id }}
                className="group block rounded-2xl overflow-hidden glass hover:shadow-elegant transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {r.cover_image_url ? (
                    <img src={r.cover_image_url} alt={r.project_title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.client_name}</p>
                  <h3 className="mt-1 text-lg font-semibold">{r.project_title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 sm:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold">Want similar results?</h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">Let's talk through your goals and map out how to get there.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/contact">Book a call <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-11 w-11 rounded-full glass flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={gallery[lightbox]} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </PageShell>
  );
}

function Block({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xs uppercase tracking-wider text-primary font-medium">{eyebrow}</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold">{title}</h2>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{body}</p>
    </motion.div>
  );
}
