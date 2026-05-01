import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Crown,
  Download,
  FileText,
  FileBarChart,
  FolderKanban,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/client/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientDashboardOverview,
});

type ClientProfile = {
  id: string;
  full_name: string;
  company_name: string | null;
  account_manager_name: string | null;
  account_manager_whatsapp: string | null;
};

type Plan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  currency: string;
  features: string[];
};

type Membership = {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  membership_plans: Plan | null;
};

type Report = {
  id: string;
  title: string;
  summary: string | null;
  is_read: boolean;
  created_at: string;
  file_path: string | null;
  file_url: string | null;
  file_type: string | null;
  period_start: string | null;
  period_end: string | null;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const NEXT_PLAN: Record<string, string> = {
  starter: "Growth",
  growth: "Enterprise",
};

const RETRY_DELAYS = [1000, 2000, 3000];

type RetryableResult = {
  error: { message?: string; code?: string } | null;
};

async function withQueryRetry<T extends RetryableResult>(
  label: string,
  run: () => Promise<T>,
) {
  let lastError: T["error"] = null;
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt += 1) {
    const result = await run();
    if (!result.error || result.error.code === "PGRST116") return result;
    lastError = result.error;
    if (attempt < RETRY_DELAYS.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }
  throw new Error(lastError?.message || `Failed to load ${label}`);
}

function ClientDashboardOverview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [activeProjects, setActiveProjects] = useState(0);
  const [reportsThisMonth, setReportsThisMonth] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Live clock — minute resolution
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
  }, []);

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    try {
      const [
        profileRes,
        membershipRes,
        projectsRes,
        reportsCountRes,
        ticketsCountRes,
        reportsListRes,
        ticketsListRes,
        notifsRes,
      ] = await Promise.all([
        withQueryRetry("profile", async () => await supabase.from("client_profiles").select("*").eq("id", uid).maybeSingle()),
        withQueryRetry("membership", async () => await supabase
          .from("client_memberships")
          .select("*, membership_plans(*)")
          .eq("client_id", uid)
          .eq("status", "active")
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle()),
        withQueryRetry("projects", async () => await supabase
          .from("client_projects")
          .select("id", { count: "exact", head: true })
          .eq("client_id", uid)
          .eq("status", "active")),
        withQueryRetry("reports count", async () => await supabase
          .from("client_reports")
          .select("id", { count: "exact", head: true })
          .eq("client_id", uid)
          .gte("created_at", monthStart.toISOString())),
        withQueryRetry("tickets count", async () => await supabase
          .from("client_tickets")
          .select("id", { count: "exact", head: true })
          .eq("client_id", uid)
          .in("status", ["open", "in_progress"])),
        withQueryRetry("reports", async () => await supabase
          .from("client_reports")
          .select(
            "id,title,summary,is_read,created_at,file_path,file_url,file_type,period_start,period_end",
          )
          .eq("client_id", uid)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3)),
        withQueryRetry("tickets", async () => await supabase
          .from("client_tickets")
          .select("id,subject,status,created_at,updated_at")
          .eq("client_id", uid)
          .order("updated_at", { ascending: false })
          .limit(5)),
        withQueryRetry("notifications", async () => await supabase
          .from("client_notifications")
          .select("id,title,body,type,is_read,created_at")
          .eq("client_id", uid)
          .order("created_at", { ascending: false })
          .limit(5)),
      ]);

      const firstError =
        profileRes.error ||
        membershipRes.error ||
        projectsRes.error ||
        reportsCountRes.error ||
        ticketsCountRes.error ||
        reportsListRes.error ||
        ticketsListRes.error ||
        notifsRes.error;
      if (firstError && firstError.code !== "PGRST116") throw firstError;

      setProfile((profileRes.data as ClientProfile) ?? null);
      setMembership((membershipRes.data as unknown as Membership) ?? null);
      setActiveProjects(projectsRes.count ?? 0);
      setReportsThisMonth(reportsCountRes.count ?? 0);
      setOpenTickets(ticketsCountRes.count ?? 0);
      setRecentReports((reportsListRes.data as Report[]) ?? []);
      setRecentTickets((ticketsListRes.data as Ticket[]) ?? []);
      setNotifications((notifsRes.data as Notification[]) ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load dashboard";
      setError(msg);
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      setProfile({
        id: uid,
        full_name:
          (sessionUser?.user_metadata?.full_name as string | undefined) ||
          sessionUser?.email?.split("@")[0] ||
          "Client",
        company_name: null,
        account_manager_name: null,
        account_manager_whatsapp: null,
      });
      setMembership(null);
      setActiveProjects(0);
      setReportsThisMonth(0);
      setOpenTickets(0);
      setRecentReports([]);
      setRecentTickets([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    void loadAll(userId);

    const channel = supabase
      .channel(`client-notifs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_notifications",
          filter: `client_id=eq.${userId}`,
        },
        () => {
          supabase
            .from("client_notifications")
            .select("id,title,body,type,is_read,created_at")
            .eq("client_id", userId)
            .order("created_at", { ascending: false })
            .limit(5)
            .then(({ data }) => setNotifications((data as Notification[]) ?? []));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadAll]);

  const { daysRemaining, totalDays, daysUsed, expired, pctUsed } = useMemo(() => {
    if (!membership)
      return { daysRemaining: 0, totalDays: 0, daysUsed: 0, expired: false, pctUsed: 0 };
    const t = Date.now();
    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const total = Math.max(1, Math.round((end - start) / 86_400_000));
    const remaining = Math.round((end - t) / 86_400_000);
    const used = Math.max(0, total - Math.max(0, remaining));
    return {
      daysRemaining: Math.max(0, remaining),
      totalDays: total,
      daysUsed: used,
      expired: end < t,
      pctUsed: Math.min(100, Math.max(0, (used / total) * 100)),
    };
  }, [membership]);

  const recentActivity = useMemo(() => {
    type Item = {
      id: string;
      kind: "report" | "ticket" | "notification";
      title: string;
      date: string;
      status?: string;
    };
    const items: Item[] = [
      ...recentReports.map((r) => ({
        id: `r-${r.id}`,
        kind: "report" as const,
        title: `New report: ${r.title}`,
        date: r.created_at,
      })),
      ...recentTickets.map((t) => ({
        id: `t-${t.id}`,
        kind: "ticket" as const,
        title: `Ticket ${t.status.replace("_", " ")}: ${t.subject}`,
        date: t.updated_at,
        status: t.status,
      })),
      ...notifications.map((n) => ({
        id: `n-${n.id}`,
        kind: "notification" as const,
        title: n.title,
        date: n.created_at,
        status: n.type,
      })),
    ];
    items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return items.slice(0, 5);
  }, [recentReports, recentTickets, notifications]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
          <div>
            <p className="font-medium">Couldn't load your dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={() => userId && loadAll(userId)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const clientName = profile?.full_name?.split(" ")[0] ?? "there";
  const planName = membership?.membership_plans?.name ?? "No plan";
  const planSlug = membership?.membership_plans?.slug;
  const nextPlan = planSlug ? NEXT_PLAN[planSlug] : undefined;
  const features = (membership?.membership_plans?.features ?? []) as string[];

  const waNumber =
    profile?.account_manager_whatsapp?.replace(/\D/g, "") || "15550000000";
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi, this is ${profile?.full_name ?? "a client"} — I'd like to chat.`,
  )}`;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="glass rounded-2xl p-6 sm:p-8 border border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
              Welcome back, {profile?.full_name ?? clientName}!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ·{" "}
              {now.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="mt-3">
              {membership && !expired && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20">
                  ✅ {planName} Plan — Active
                </Badge>
              )}
              {membership && expired && (
                <Badge variant="destructive">
                  ❌ Plan Expired — Contact us to renew
                </Badge>
              )}
              {!membership && (
                <Badge variant="secondary">No active membership</Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {!membership && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-8 text-center space-y-4">
            <Crown className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h3 className="text-xl font-semibold">Choose Your Plan</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Select a membership plan to unlock all features and start growing your brand.
              </p>
            </div>
            <Button asChild>
              <Link to="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="h-4 w-4" />}
          label="Active Projects"
          value={activeProjects}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Reports This Month"
          value={reportsThisMonth}
        />
        <StatCard
          icon={<LifeBuoy className="h-4 w-4" />}
          label="Open Tickets"
          value={openTickets}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Days Remaining"
          value={
            !membership ? "—" : expired ? "Expired" : daysRemaining
          }
          tone={
            !membership
              ? "default"
              : expired
                ? "danger"
                : daysRemaining < 7
                  ? "warning"
                  : "default"
          }
        />
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Membership */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" /> Membership
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">{planName}</p>
                {membership?.membership_plans && (
                  <p className="text-sm text-muted-foreground">
                    {membership.membership_plans.currency}{" "}
                    {membership.membership_plans.price_monthly}/mo
                  </p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/client/dashboard/membership">View Full Plan Details</Link>
              </Button>
            </div>

            {membership && (
              <div className="space-y-2">
                <Progress value={pctUsed} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Started {new Date(membership.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span>
                    Expires {new Date(membership.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {daysUsed} of {totalDays} days used
                </p>
              </div>
            )}

            {features.length > 0 && (
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {nextPlan && !expired && (
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/pricing">↑ Upgrade to {nextPlan}</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No activity yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3">
                    <ActivityIcon kind={item.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {timeAgo(item.date, now)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-primary" /> Recent Reports
          </CardTitle>
          <Link
            to="/client/dashboard/reports"
            className="text-xs text-primary hover:underline"
          >
            View All Reports →
          </Link>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No reports yet. Your first report will appear here soon.
            </p>
          ) : (
            <ul className="grid md:grid-cols-3 gap-3">
              {recentReports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <section className="grid sm:grid-cols-3 gap-4">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/client/dashboard/reports">
            <FileText className="h-4 w-4 mr-2" />
            View Latest Report
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link to="/client/dashboard/tickets" search={{ id: undefined }}>
            <LifeBuoy className="h-4 w-4 mr-2" />
            Create Support Ticket
          </Link>
        </Button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-4 text-sm font-medium shadow-sm transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Support
        </a>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "warning";
}) {
  const toneText =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <div className="group glass rounded-2xl border border-border/40 p-5 transition-all hover:border-primary/40 hover:shadow-glow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${toneText}`}>{value}</p>
    </div>
  );
}

function ActivityIcon({
  kind,
}: {
  kind: "report" | "ticket" | "notification";
}) {
  const Icon = kind === "report" ? FileText : kind === "ticket" ? LifeBuoy : Bell;
  return (
    <span className="grid place-items-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [busy, setBusy] = useState(false);
  const handleDownload = async () => {
    if (!report.file_path && !report.file_url) {
      toast.error("No file attached to this report");
      return;
    }
    setBusy(true);
    try {
      if (report.file_path) {
        const { data, error } = await supabase.storage
          .from("client-reports")
          .download(report.file_path);
        if (error) throw error;
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = report.file_path.split("/").pop() || `${report.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (report.file_url) {
        window.open(report.file_url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const range =
    report.period_start && report.period_end
      ? `${new Date(report.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(report.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : new Date(report.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  return (
    <li className="rounded-xl border border-border/60 p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{report.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{range}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={busy}
        className="w-full"
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Download
      </Button>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    </div>
  );
}

function timeAgo(iso: string, now: Date) {
  const diff = now.getTime() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
