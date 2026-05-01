import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { subscribeToTable } from "@/lib/realtime";

type Project = {
  id: string;
  slug: string | null;
  client_name: string;
  project_title: string;
  category: string;
  service_type: string | null;
  cover_image_url: string | null;
  roi_pct: number | null;
  growth_pct: number | null;
  revenue_label: string | null;
};

const FILTERS = [
  { key: "all", label: "All", value: null },
  { key: "social", label: "Social Media", value: "social-media" },
  { key: "ads", label: "Paid Ads", value: "paid-ads" },
  { key: "seo", label: "SEO", value: "seo" },
  { key: "branding", label: "Branding", value: "branding" },
  { key: "design", label: "Design", value: "design" },
];

const PAGE_SIZE = 9;

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Our Work — Let Us Grow" },
      { name: "description", content: "Selected case studies for ambitious brands. Real campaigns, real revenue." },
      { property: "og:title", content: "Our Work — Let Us Grow" },
      { property: "og:description", content: "Real campaigns, real revenue. See the work." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = () => supabase
      .from("portfolio")
      .select("id, slug, client_name, project_title, category, service_type, cover_image_url, roi_pct, growth_pct, revenue_label, is_visible, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setProjects((data ?? []) as Project[]);
        setLoading(false);
      });
    loadProjects();
    const unsubscribe = subscribeToTable("portfolio", loadProjects, "public-portfolio-changes");
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === activeFilter);
    if (!f || !f.value) return projects;
    return projects.filter((p) => (p.service_type ?? "").toLowerCase() === f.value);
  }, [projects, activeFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Selected work"
        title="Our Work"
        subtitle="A snapshot of recent engagements. Click any case study for the full story."
      />

      {/* Filter bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <LayoutGroup>
          <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-4 sm:px-0 min-w-max sm:min-w-0 border-b border-border">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => { setActiveFilter(f.key); setVisibleCount(PAGE_SIZE); }}
                    className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                    {isActive && (
                      <motion.span
                        layoutId="filter-underline"
                        className="absolute left-2 right-2 -bottom-px h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl glass animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl">
            <p className="text-lg text-muted-foreground">More case studies coming soon</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {visible.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <ProjectCard project={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const slug = project.slug ?? project.id;
  const metrics = [
    project.roi_pct != null && { label: "ROI", value: `${project.roi_pct}%` },
    project.growth_pct != null && { label: "Growth", value: `+${project.growth_pct}%` },
    project.revenue_label && { label: "Revenue", value: project.revenue_label },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Link
      to="/portfolio/$slug"
      params={{ slug }}
      className="group block rounded-2xl overflow-hidden glass hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.project_title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <TrendingUp className="h-10 w-10 text-primary/40" />
          </div>
        )}
        {project.service_type && (
          <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs font-medium text-primary">
            {project.service_type.replace(/-/g, " ")}
          </span>
        )}
        <div className="absolute top-3 right-3 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{project.client_name}</p>
        <h3 className="mt-1 text-lg font-semibold line-clamp-2">{project.project_title}</h3>
        {metrics.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/40 px-2 py-2 text-center">
                <div className="text-sm font-semibold text-primary">{m.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
