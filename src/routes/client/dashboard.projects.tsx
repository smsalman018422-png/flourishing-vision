import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        setProjects([]);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as unknown as Project[];
      setProjects(list);

      const ids = Array.from(new Set(list.flatMap((p) => p.assigned_team_ids ?? [])));
      if (ids.length) {
        const { data: members } = await supabase
          .from("team_members")
          .select("id,name,photo_url")
          .in("id", ids);
        const map: Record<string, TeamMember> = {};
        for (const m of (members ?? []) as TeamMember[]) map[m.id] = m;
        setTeam(map);
      } else {
        setTeam({});
      }
      setLoading(false);
    })();
  }, [userId]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? projects
        : projects.filter((p) => p.status === filter),
    [filter, projects],
  );

  const openProject = openId ? projects.find((p) => p.id === openId) ?? null : null;

  if (!ready || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/client/dashboard"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight">
              My Projects
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No projects in this view yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                team={team}
                onOpen={() => setOpenId(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!openProject} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openProject && <ProjectDetail project={openProject} team={team} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusVariant(status: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  switch (status) {
    case "active":
      return {
        variant: "outline",
        className:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "completed":
      return {
        variant: "outline",
        className:
          "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      };
    case "paused":
      return {
        variant: "outline",
        className:
          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    default:
      return { variant: "outline", className: "" };
  }
}

function ProjectCard({
  project,
  team,
  onOpen,
}: {
  project: Project;
  team: Record<string, TeamMember>;
  onOpen: () => void;
}) {
  const s = statusVariant(project.status);
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{project.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.service_type && (
                <Badge variant="secondary">{project.service_type}</Badge>
              )}
              <Badge variant={s.variant} className={`capitalize ${s.className}`}>
                {project.status}
              </Badge>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {fmtRange(project.start_date, project.end_date)}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
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
              onOpen();
            }}
          >
            Details →
          </Button>
        </div>
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
    return <span className="text-xs text-muted-foreground">No team assigned</span>;
  }
  const visible = ids.slice(0, 4);
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
        <span className="grid place-items-center h-8 w-8 rounded-full border-2 border-background bg-muted text-xs">
          +{extra}
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
  const s = statusVariant(project.status);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">{project.name}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-2">
        <div className="flex flex-wrap gap-2">
          {project.service_type && (
            <Badge variant="secondary">{project.service_type}</Badge>
          )}
          <Badge variant={s.variant} className={`capitalize ${s.className}`}>
            {project.status}
          </Badge>
        </div>

        {project.description && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>
          </section>
        )}

        <section>
          <h4 className="text-sm font-semibold mb-2">Progress</h4>
          <Progress value={project.progress} />
          <p className="mt-1 text-xs text-muted-foreground">{project.progress}% complete</p>
        </section>

        <section>
          <h4 className="text-sm font-semibold mb-2">Deliverables</h4>
          {project.deliverables?.length ? (
            <ul className="space-y-2">
              {project.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {d.done ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={d.done ? "line-through text-muted-foreground" : ""}>
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
          <h4 className="text-sm font-semibold mb-2">Timeline</h4>
          <p className="text-sm text-muted-foreground">
            {fmtRange(project.start_date, project.end_date) || "Not scheduled"}
          </p>
        </section>

        {project.notes && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {project.notes}
            </p>
          </section>
        )}

        {project.assigned_team_ids?.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Team</h4>
            <TeamAvatars ids={project.assigned_team_ids} team={team} />
          </section>
        )}
      </div>
    </>
  );
}

function fmtRange(start: string | null, end: string | null) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Due ${fmt(end)}`;
  return "";
}
