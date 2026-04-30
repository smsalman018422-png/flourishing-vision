import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Mail, Users, Briefcase, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  ),
});

function Dashboard() {
  const [counts, setCounts] = useState({ contacts: 0, team: 0, portfolio: 0, posts: 0 });
  const [chart, setChart] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("contact_submissions").select("created_at"),
      supabase.from("team_members").select("id"),
      supabase.from("portfolio").select("id"),
      supabase.from("blog_posts").select("id"),
    ]).then(([c, t, p, b]) => {
      setCounts({
        contacts: c.data?.length ?? 0,
        team: t.data?.length ?? 0,
        portfolio: p.data?.length ?? 0,
        posts: b.data?.length ?? 0,
      });
      // Group contacts by day for last 14 days
      const buckets: Record<string, number> = {};
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (c.data ?? []).forEach((row: { created_at: string }) => {
        const k = row.created_at.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      setChart(Object.entries(buckets).map(([day, count]) => ({ day: day.slice(5), count })));
    });
  }, []);

  const kpis = [
    { label: "Contacts", value: counts.contacts, Icon: Mail },
    { label: "Team members", value: counts.team, Icon: Users },
    { label: "Portfolio items", value: counts.portfolio, Icon: Briefcase },
    { label: "Blog posts", value: counts.posts, Icon: FileText },
  ];

  return (
    <>
      <PageTitle title="Dashboard" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-display font-semibold">{value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display font-semibold mb-4">Contacts — last 14 days</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
              <YAxis allowDecimals={false} stroke="currentColor" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="oklch(0.62 0.16 150)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
