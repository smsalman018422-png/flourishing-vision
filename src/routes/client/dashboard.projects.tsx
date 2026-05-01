import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ChevronDown,
  FolderOpen,
} from "lucide-react";

const RETRY_DELAYS = [1000, 2000, 3000];

async function withRetry<T extends { error: { message?: string } | null }>(run: () => Promise<T>) {
  let result: T | null = null;
  for (let i = 0; i < RETRY_DELAYS.length; i += 1) {
    result = await run();
    if (!result.error) return result;
    if (i < RETRY_DELAYS.length - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[i]));
  }
  return result!;
}

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  service_type: string | null;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  assigned_team_ids: string[];
  deliverables: { label: string; done?: boolean }[];
  notes: string | null;
};

type TeamMember = {
  id: string;
  name: string;
  photo_url: string | null;
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]["key"];

export const Route = createFileRoute("/client/dashboard/projects")({
  head: () => ({
    meta: [
      { title: "My Projects — LetUsGrow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<Record<string, TeamMember>>({});
  const [filter, setFilter] = useState<StatusKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await withRetry(async () => await supabase
        .from("client_projects")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false }));

      if (error) {
        setError(error.message || "Failed to load projects");
        setProjects([]);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as unknown as Project[];
      setProjects(list);

      const ids = Array.from(
        new Set(list.flatMap((p) => p.assigned_team_ids ?? [])),
      );
      if (ids.length) {
        const { data: members } = await withRetry(async () => await supabase
          .from("team_members")
          .select("id,name,photo_url")
          .in("id", ids));
        const map: Record<string, TeamMember> = {};
        for (const m of (members ?? []) as TeamMember[]) map[m.id] = m;
        setTeam(map);
      } else {
        setTeam({});
      }
      setLoading(false);
    })();
  }, [userId, retryNonce]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? projects
        : projects.filter((p) => p.status === filter),
    [filter, projects],
  );

  if (!ready || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            to="/client/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
              My Projects
            </h1>
            <div className="relative flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
              {STATUS_FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="relative px-4 py-1.5 text-sm rounded-full transition-colors"
                  >
                    {active && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center space-y-4">
              <p className="font-medium">Couldn't load your projects</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => setRetryNonce((n) => n + 1)} variant="outline">Try Again</Button>
            </CardContent>
          </Card>
        )}

        {!error && filtered.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-4">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">
                You don't have any projects yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact us to get started!
              </p>
            </CardContent>
          </Card>
        ) : !error ? (
          <motion.div layout className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectCard
                    project={p}
                    team={team}
                    expanded={expandedId === p.id}
                    onToggle={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

const SERVICE_COLORS: Record<string, string> = {
  "Social Media": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Paid Ads": "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  SEO: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Branding: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
};

function serviceClass(type: string | null) {
  if (!type) return "bg-muted text-muted-foreground border-border";
  return (
    SERVICE_COLORS[type] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "completed":
      return "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "paused":
      return "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function ProjectCard({
  project,
  team,
  expanded,
  onToggle,
}: {
  project: Project;
  team: Record<string, TeamMember>;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md overflow-hidden"
      onClick={onToggle}
    >
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold">{project.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.service_type && (
                <Badge
                  variant="outline"
                  className={serviceClass(project.service_type)}
                >
                  {project.service_type}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`capitalize ${statusClass(project.status)}`}
              >
                {project.status}
              </Badge>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
            {fmtRange(project.start_date, project.end_date)}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        <div className="flex items-center justify-between">
          <TeamAvatars ids={project.assigned_team_ids} team={team} />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {expanded ? "Hide" : "Details"}
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ProjectDetail project={project} team={team} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function TeamAvatars({
  ids,
  team,
}: {
  ids: string[];
  team: Record<string, TeamMember>;
}) {
  if (!ids?.length) {
    return (
      <span className="text-xs text-muted-foreground">No team assigned</span>
    );
  }
  const visible = ids.slice(0, 3);
  const extra = ids.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((id) => {
        const m = team[id];
        const initials = (m?.name ?? "?")
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <Avatar key={id} className="h-8 w-8 border-2 border-background">
            {m?.photo_url && <AvatarImage src={m.photo_url} alt={m.name} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        );
      })}
      {extra > 0 && (
        <span className="grid place-items-center h-8 w-8 rounded-full border-2 border-background bg-muted text-xs font-medium">
          +{extra} more
        </span>
      )}
    </div>
  );
}

function ProjectDetail({
  project,
  team,
}: {
  project: Project;
  team: Record<string, TeamMember>;
}) {
  return (
    <div className="pt-6 mt-2 border-t border-border space-y-6">
      {project.description && (
        <section>
          <h4 className="text-sm font-semibold mb-2">Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </p>
        </section>
      )}

      <section>
        <h4 className="text-sm font-semibold mb-3">Deliverables</h4>
        {project.deliverables?.length ? (
          <ul className="space-y-2">
            {project.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {d.done ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span
                  className={
                    d.done ? "line-through text-muted-foreground" : ""
                  }
                >
                  {d.label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No deliverables yet.</p>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-3">Timeline</h4>
        <Timeline
          start={project.start_date}
          end={project.end_date}
          progress={project.progress}
        />
      </section>

      {project.notes && (
        <section>
          <h4 className="text-sm font-semibold mb-2">Notes from your team</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line rounded-md bg-muted/50 p-3 border border-border">
            {project.notes}
          </p>
        </section>
      )}

      {project.assigned_team_ids?.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold mb-3">Assigned team</h4>
          <TeamAvatars ids={project.assigned_team_ids} team={team} />
        </section>
      )}
    </div>
  );
}

function Timeline({
  start,
  end,
  progress,
}: {
  start: string | null;
  end: string | null;
  progress: number;
}) {
  if (!start && !end) {
    return <p className="text-sm text-muted-foreground">Not scheduled</p>;
  }
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{start ? fmtDate(start) : "—"}</span>
        <span className="font-medium text-foreground">{pct}%</span>
        <span>{end ? fmtDate(end) : "—"}</span>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function fmtRange(start: string | null, end: string | null) {
  if (start && end) return `${fmtDate(start)} - ${fmtDate(end)}`;
  if (start) return `From ${fmtDate(start)}`;
  if (end) return `Due ${fmtDate(end)}`;
  return "";
}
