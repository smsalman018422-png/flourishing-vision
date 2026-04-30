import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  client_name: string;
  project_title: string;
  category: string;
  cover_image_url: string | null;
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
      { title: `Case study — ${params.slug} — LetUsGrow` },
      { name: "description", content: "A LetUsGrow case study: challenge, solution, and measurable results." },
      { property: "og:title", content: `Case study — ${params.slug}` },
      { property: "og:description", content: "Challenge, solution, results." },
    ],
  }),
  component: ProjectDetail,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProjectDetail() {
  const { slug } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("portfolio")
      .select("*")
      .limit(50)
      .then(({ data }) => {
        if (cancelled) return;
        const match = (data ?? []).find((p) => slugify(p.project_title) === slug || p.id === slug) as Project | undefined;
        if (!match) {
          setMissing(true);
        } else {
          setProject(match);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Loading case study…" />
      </PageShell>
    );
  }

  if (missing || !project) {
    return (
      <PageShell>
        <PageHeader title="Project not found" subtitle="That case study doesn't exist or has moved." />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
          <Link to="/portfolio" className="text-primary underline-offset-4 hover:underline">← All work</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader eyebrow={project.category} title={project.project_title} subtitle={`For ${project.client_name}`} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 space-y-8">
        {project.cover_image_url && (
          <img
            src={project.cover_image_url}
            alt={project.project_title}
            loading="lazy"
            className="w-full rounded-2xl border border-border/60"
          />
        )}
        <div className="grid gap-6 sm:grid-cols-3">
          {project.roi_pct !== null && (
            <div className="glass rounded-2xl p-6">
              <div className="text-3xl font-display font-semibold text-gradient">{project.roi_pct}%</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">ROI</div>
            </div>
          )}
          {project.growth_pct !== null && (
            <div className="glass rounded-2xl p-6">
              <div className="text-3xl font-display font-semibold text-gradient">{project.growth_pct}%</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">Growth</div>
            </div>
          )}
          {project.revenue_label && (
            <div className="glass rounded-2xl p-6">
              <div className="text-3xl font-display font-semibold text-gradient">{project.revenue_label}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">Revenue impact</div>
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {project.challenge && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold">Challenge</h3>
              <p className="mt-3 text-sm text-muted-foreground">{project.challenge}</p>
            </div>
          )}
          {project.solution && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold">Solution</h3>
              <p className="mt-3 text-sm text-muted-foreground">{project.solution}</p>
            </div>
          )}
          {project.results && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold">Results</h3>
              <p className="mt-3 text-sm text-muted-foreground">{project.results}</p>
            </div>
          )}
        </div>
        {project.testimonial_quote && (
          <blockquote className="glass rounded-2xl p-8">
            <p className="text-lg sm:text-xl font-display">"{project.testimonial_quote}"</p>
            <footer className="mt-4 text-sm text-muted-foreground">
              — {project.testimonial_author}{project.testimonial_role ? `, ${project.testimonial_role}` : ""}
            </footer>
          </blockquote>
        )}
        <Link to="/portfolio" className="inline-flex text-sm text-primary hover:underline">← All work</Link>
      </section>
    </PageShell>
  );
}
