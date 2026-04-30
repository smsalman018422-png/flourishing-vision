import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Mail, Users, Briefcase, BadgeCheck, Plus, ArrowRight, Inbox } from "lucide-react";

type Contact = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  service: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  ),
});

function Dashboard() {
  const [counts, setCounts] = useState({ team: 0, portfolio: 0, newContacts: 0, subscribers: 0 });
  const [recent, setRecent] = useState<Contact[]>([]);
  const [chart, setChart] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    Promise.all([
      supabase.from("team_members").select("id", { count: "exact", head: true }),
      supabase.from("portfolio").select("id", { count: "exact", head: true }),
      supabase.from("contact_submissions").select("id", { count: "exact", head: true }).gte("created_at", since7),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      supabase.from("contact_submissions").select("id, full_name, email, company, service, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("contact_submissions").select("created_at").gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
    ]).then(([t, p, c7, sub, recentRows, chartRows]) => {
      setCounts({
        team: t.count ?? 0,
        portfolio: p.count ?? 0,
        newContacts: c7.count ?? 0,
        subscribers: sub.count ?? 0,
      });
      setRecent((recentRows.data ?? []) as Contact[]);

      const buckets: Record<string, number> = {};
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (chartRows.data ?? []).forEach((row: { created_at: string }) => {
        const k = row.created_at.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      setChart(Object.entries(buckets).map(([day, count]) => ({ day: day.slice(5), count })));
    });
  }, []);

  const kpis = [
    { label: "Team members", value: counts.team, Icon: Users, to: "/admin/team" },
    { label: "Portfolio items", value: counts.portfolio, Icon: Briefcase, to: "/admin/portfolio" },
    { label: "New contacts (7d)", value: counts.newContacts, Icon: Mail, to: "/admin/contacts" },
    { label: "Newsletter subs", value: counts.subscribers, Icon: BadgeCheck, to: "/admin/settings" },
  ];

  return (
    <>
      <PageTitle title="Dashboard" />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, Icon, to }) => (
          <Link key={label} to={to} className="block">
            <Card className="hover:shadow-elegant transition-shadow h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-display font-semibold">{value}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickAction to="/admin/team" label="Add team member" Icon={Users} />
        <QuickAction to="/admin/portfolio" label="Add case study" Icon={Briefcase} />
        <QuickAction to="/admin/contacts" label="View contacts" Icon={Mail} />
      </div>

      {/* Chart */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Contact submissions — last 30 days</h2>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
              <YAxis allowDecimals={false} stroke="currentColor" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="oklch(0.62 0.16 150)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent contacts */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Recent contact submissions</h2>
          <Link to="/admin/contacts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto opacity-50" />
            <p className="mt-2 text-sm">No submissions yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Service</th>
                    <th className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 pr-4 font-medium">{c.full_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.email}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.company ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.service ?? "—"}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{relativeTime(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden space-y-3">
              {recent.map((c) => (
                <li key={c.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{relativeTime(c.created_at)}</span>
                  </div>
                  {(c.company || c.service) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.company}{c.company && c.service ? " · " : ""}{c.service}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

function QuickAction({ to, label, Icon }: { to: string; label: string; Icon: any }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-2xl glass p-4 hover:shadow-elegant transition-all hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-xl bg-primary/15 text-primary grid place-items-center">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium text-sm">{label}</span>
      </span>
      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
