import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/admin/States";
import { applyRealtimeChange, fetchWithCache, invalidateAdminCache } from "@/lib/admin-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, FileBarChart, Sparkles, Upload } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type Client = { id: string; full_name: string };
type Project = { id: string; client_id: string; name: string };
type Report = {
  id: string;
  client_id: string;
  title: string;
  report_type: string;
  week_start: string | null;
  week_end: string | null;
  file_url: string | null;
  file_path: string | null;
  is_published: boolean;
  client?: { full_name: string } | null;
};

export const Route = createFileRoute("/admin/client-reports")({
  head: () => ({ meta: [{ title: "Client Reports — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <ReportsPage />
    </AdminShell>
  ),
});

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [openUpload, setOpenUpload] = useState(false);

  const fetchAll = async (force = false) => {
    if (force) invalidateAdminCache("admin-client-reports");
    if (reports.length === 0) setLoading(true);
    const { r, c, p } = await fetchWithCache("admin-client-reports", async () => {
      const [reportsRes, clientsRes, projectsRes] = await Promise.all([
        sb.from("client_reports").select("id,client_id,title,report_type,week_start,week_end,file_url,file_path,is_published,created_at, client:client_profiles(full_name)").order("created_at", { ascending: false }),
        sb.from("client_profiles").select("id,full_name").order("full_name"),
        sb.from("client_projects").select("id,client_id,name"),
      ]);
      return { r: reportsRes.data ?? [], c: clientsRes.data ?? [], p: projectsRes.data ?? [] };
    });
    setReports(r);
    setClients(c);
    setProjects(p);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = sb
      .channel("admin-client-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_reports" }, (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: Partial<Report>; old: Partial<Report> }) => {
        setReports((prev) => applyRealtimeChange(prev, payload));
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => filterClient === "all" ? reports : reports.filter((r) => r.client_id === filterClient),
    [reports, filterClient],
  );

  return (
    <>
      <PageTitle
        title="Client Reports"
        action={
          <Button onClick={() => setOpenUpload(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Upload Report
          </Button>
        }
      />

      <Card className="mb-4">
        <Label className="mb-2 block">Filter by Client</Label>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <Card className="p-0"><LoadingState rows={8} /></Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileBarChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">No reports yet.</div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border/60">
              <tr>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Period</th>
                <th className="text-left p-3">File</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="p-3">{r.client?.full_name ?? "—"}</td>
                  <td className="p-3 font-medium">{r.title}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{r.report_type}</Badge></td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.week_start && r.week_end
                      ? `${new Date(r.week_start).toLocaleDateString()} – ${new Date(r.week_end).toLocaleDateString()}`
                      : "—"}
                  </td>
                  <td className="p-3">
                    {r.file_url ? (
                      <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    {r.is_published
                      ? <Badge className="bg-emerald-500/15 text-emerald-400">Published</Badge>
                      : <Badge variant="outline">Draft</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <UploadReportDialog
        open={openUpload}
        onOpenChange={setOpenUpload}
        clients={clients}
        projects={projects}
        onSaved={() => fetchAll(true)}
      />
    </>
  );
}

function UploadReportDialog({
  open, onOpenChange, clients, projects, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
  projects: Project[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    title: "",
    report_type: "weekly" as "weekly" | "monthly" | "custom",
    week_start: "",
    week_end: "",
    impressions: "",
    clicks: "",
    conversions: "",
    spend: "",
    revenue: "",
    summary: "",
    is_published: true,
  });
  const [file, setFile] = useState<File | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const roi = useMemo(() => {
    const s = parseFloat(form.spend);
    const r = parseFloat(form.revenue);
    if (!s || isNaN(s) || isNaN(r)) return 0;
    return Math.round(((r - s) / s) * 100);
  }, [form.spend, form.revenue]);

  const clientProjects = projects.filter((p) => p.client_id === form.client_id);

  const generateAi = async () => {
    if (!form.client_id) { toast.error("Select a client first"); return; }
    setAiLoading(true);
    try {
      const metrics = {
        impressions: Number(form.impressions) || 0,
        clicks: Number(form.clicks) || 0,
        conversions: Number(form.conversions) || 0,
        spend: Number(form.spend) || 0,
        revenue: Number(form.revenue) || 0,
        roi,
      };
      const { data, error } = await sb.functions.invoke("generate-report-summary", {
        body: { metrics, title: form.title, period: `${form.week_start} to ${form.week_end}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      update("summary", data.summary || "");
      toast.success("AI summary generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!form.client_id || !form.title.trim()) {
      toast.error("Client and title are required");
      return;
    }
    setSubmitting(true);
    try {
      let file_url: string | null = null;
      let file_path: string | null = null;
      let file_type: string | null = null;
      if (file) {
        const ts = Date.now();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${form.client_id}/${ts}-${safe}`;
        const { error: upErr } = await sb.storage.from("client-reports").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        file_path = path;
        file_type = file.name.split(".").pop()?.toLowerCase() ?? null;
        const { data: signed } = await sb.storage.from("client-reports").createSignedUrl(path, 60 * 60 * 24 * 365);
        file_url = signed?.signedUrl ?? null;
      }

      const metrics = {
        impressions: Number(form.impressions) || 0,
        clicks: Number(form.clicks) || 0,
        conversions: Number(form.conversions) || 0,
        spend: Number(form.spend) || 0,
        revenue: Number(form.revenue) || 0,
        roi,
      };

      const { error } = await sb.from("client_reports").insert({
        client_id: form.client_id,
        project_id: form.project_id || null,
        title: form.title.trim(),
        report_type: form.report_type,
        week_start: form.week_start || null,
        week_end: form.week_end || null,
        period_start: form.week_start ? new Date(form.week_start).toISOString() : null,
        period_end: form.week_end ? new Date(form.week_end).toISOString() : null,
        summary: form.summary || null,
        metrics,
        file_url, file_path, file_type,
        is_published: form.is_published,
      });
      if (error) throw error;

      if (form.is_published) {
        await sb.from("client_notifications").insert({
          client_id: form.client_id,
          title: "New report available",
          body: `New report available: ${form.title}`,
          type: "info",
          link: "/client/dashboard/reports",
        });
      }

      toast.success("Report saved");
      onOpenChange(false);
      setFile(null);
      setForm({
        client_id: "", project_id: "", title: "", report_type: "weekly",
        week_start: "", week_end: "",
        impressions: "", clicks: "", conversions: "", spend: "", revenue: "",
        summary: "", is_published: true,
      });
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Upload Report</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => { update("client_id", v); update("project_id", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => update("project_id", v)} disabled={!form.client_id}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {clientProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.report_type} onValueChange={(v) => update("report_type", v as "weekly" | "monthly" | "custom")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period Start</Label>
              <Input type="date" value={form.week_start} onChange={(e) => update("week_start", e.target.value)} />
            </div>
            <div>
              <Label>Period End</Label>
              <Input type="date" value={form.week_end} onChange={(e) => update("week_end", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Impressions</Label><Input type="number" value={form.impressions} onChange={(e) => update("impressions", e.target.value)} /></div>
            <div><Label>Clicks</Label><Input type="number" value={form.clicks} onChange={(e) => update("clicks", e.target.value)} /></div>
            <div><Label>Conversions</Label><Input type="number" value={form.conversions} onChange={(e) => update("conversions", e.target.value)} /></div>
            <div><Label>Ad Spend ($)</Label><Input type="number" value={form.spend} onChange={(e) => update("spend", e.target.value)} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue} onChange={(e) => update("revenue", e.target.value)} /></div>
            <div><Label>ROI %</Label><Input value={`${roi}%`} readOnly className="bg-muted/30" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Summary</Label>
              <Button size="sm" variant="outline" onClick={generateAi} disabled={aiLoading} type="button">
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate AI Summary
              </Button>
            </div>
            <Textarea rows={4} value={form.summary} onChange={(e) => update("summary", e.target.value)} />
          </div>

          <div>
            <Label>File (.pdf, .csv, .xlsx)</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex-1 border border-dashed border-border/60 rounded-xl p-3 text-sm text-muted-foreground hover:border-primary/40 cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="truncate">{file ? file.name : "Choose file…"}</span>
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <Label htmlFor="publish">Publish report</Label>
            <Switch id="publish" checked={form.is_published} onCheckedChange={(v) => update("is_published", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
