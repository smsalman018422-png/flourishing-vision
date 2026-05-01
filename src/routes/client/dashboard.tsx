import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  FolderKanban,
  Loader2,
  LifeBuoy,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/client/dashboard")({
  head: () => ({
    meta: [
      { title: "Client Dashboard — LetUsGrow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientDashboardPage,
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
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

function ClientDashboardPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [activeProjects, setActiveProjects] = useState(0);
  const [reportsThisMonth, setReportsThisMonth] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auth gate
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user.id;
      if (!uid) {
        navigate({ to: "/admin/login" });
        return;
      }
      setUserId(uid);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) navigate({ to: "/admin/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const loadAll = async (uid: string) => {
    setLoading(true);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

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
      supabase.from("client_profiles").select("*").eq("id", uid).maybeSingle(),
      supabase
        .from("client_memberships")
        .select("*, membership_plans(*)")
        .eq("client_id", uid)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("client_projects")
        .select("id", { count: "exact", head: true })
        .eq("client_id", uid)
        .eq("status", "active"),
      supabase
        .from("client_reports")
        .select("id", { count: "exact", head: true })
        .eq("client_id", uid)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("client_tickets")
        .select("id", { count: "exact", head: true })
        .eq("client_id", uid)
        .in("status", ["open", "in_progress"]),
      supabase
        .from("client_reports")
        .select("id,title,summary,is_read,created_at")
        .eq("client_id", uid)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("client_tickets")
        .select("id,subject,status,created_at")
        .eq("client_id", uid)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("client_notifications")
        .select("id,title,body,type,is_read,created_at")
        .eq("client_id", uid)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (profileRes.error && profileRes.error.code !== "PGRST116") {
      toast.error(profileRes.error.message);
    }
    setProfile((profileRes.data as ClientProfile) ?? null);
    setMembership((membershipRes.data as unknown as Membership) ?? null);
    setActiveProjects(projectsRes.count ?? 0);
    setReportsThisMonth(reportsCountRes.count ?? 0);
    setOpenTickets(ticketsCountRes.count ?? 0);
    setRecentReports((reportsListRes.data as Report[]) ?? []);
    setRecentTickets((ticketsListRes.data as Ticket[]) ?? []);
    setNotifications((notifsRes.data as Notification[]) ?? []);
    setLoading(false);
  };

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
  }, [userId]);

  const { daysRemaining, totalDays, daysUsed, expired } = useMemo(() => {
    if (!membership) return { daysRemaining: 0, totalDays: 0, daysUsed: 0, expired: false };
    const now = Date.now();
    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const total = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const remaining = Math.round((end - now) / (1000 * 60 * 60 * 24));
    const used = Math.max(0, total - Math.max(0, remaining));
    return {
      daysRemaining: Math.max(0, remaining),
      totalDays: total,
      daysUsed: used,
      expired: end < now,
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
        title: r.title,
        date: r.created_at,
        status: r.is_read ? "read" : "new",
      })),
      ...recentTickets.map((t) => ({
        id: `t-${t.id}`,
        kind: "ticket" as const,
        title: t.subject,
        date: t.created_at,
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

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clientName = profile?.full_name?.split(" ")[0] ?? "there";
  const planName = membership?.membership_plans?.name ?? "No plan";
  const planSlug = membership?.membership_plans?.slug;
  const canUpgrade = planSlug === "starter" || planSlug === "growth";
  const features = (membership?.membership_plans?.features ?? []) as string[];

  const waNumber = profile?.account_manager_whatsapp?.replace(/\D/g, "") || "15550000000";
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi, this is ${profile?.full_name ?? "a client"} — I'd like to chat.`,
  )}`;

  const latestReportId = recentReports[0]?.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Welcome banner */}
        <section className="glass rounded-2xl p-6 sm:p-8 border border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
                Welcome back, {clientName}!
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={expired ? "destructive" : "default"}>{planName}</Badge>
                {membership && (
                  <span className="text-muted-foreground">
                    Valid until{" "}
                    {new Date(membership.end_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {expired ? "expired" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`}
                  </span>
                )}
                {!membership && (
                  <span className="text-muted-foreground">No active membership.</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/contact">Manage plan</Link>
              </Button>
            </div>
          </div>

          {expired && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Your plan has expired.</p>
                <p className="text-destructive/80 mt-1">
                  Contact us to renew and restore full access to your projects and reports.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Stats */}
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
            label="Days Until Renewal"
            value={membership ? daysRemaining : "—"}
            tone={expired ? "danger" : "default"}
          />
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent activity */}
          <Card className="lg:col-span-2">
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
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <ActivityIcon kind={item.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {item.status && (
                        <Badge variant="secondary" className="capitalize">
                          {item.status.replace("_", " ")}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <Link to="/client/dashboard" className="text-primary hover:underline">
                  All reports →
                </Link>
                <Link to="/client/dashboard" className="text-primary hover:underline">
                  All tickets →
                </Link>
                <Link to="/client/dashboard" className="text-primary hover:underline">
                  All notifications →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Membership status */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Membership</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-semibold">{planName}</p>
                {membership?.membership_plans && (
                  <p className="text-sm text-muted-foreground">
                    {membership.membership_plans.currency}{" "}
                    {membership.membership_plans.price_monthly}/mo
                  </p>
                )}
              </div>

              {membership && (
                <div className="space-y-2">
                  <Progress value={totalDays ? (daysUsed / totalDays) * 100 : 0} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{daysUsed} days used</span>
                    <span>{totalDays} days total</span>
                  </div>
                </div>
              )}

              {features.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              {canUpgrade && (
                <Button asChild className="w-full">
                  <Link to="/pricing">Upgrade Plan</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <section className="grid sm:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to="/contact">
              <LifeBuoy className="h-4 w-4 mr-2" />
              Create Support Ticket
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto py-4 justify-start"
            disabled={!latestReportId}
          >
            <Link to="/client/dashboard">
              <FileText className="h-4 w-4 mr-2" />
              View Latest Report
            </Link>
          </Button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-4 text-sm font-medium shadow-sm transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Account Manager
          </a>
        </section>
      </div>
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
  tone?: "default" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p
          className={`mt-2 text-3xl font-semibold ${
            tone === "danger" ? "text-destructive" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ kind }: { kind: "report" | "ticket" | "notification" }) {
  const Icon = kind === "report" ? FileText : kind === "ticket" ? LifeBuoy : Bell;
  return (
    <span className="grid place-items-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0">
      <Icon className="h-4 w-4" />
    </span>
  );
}
