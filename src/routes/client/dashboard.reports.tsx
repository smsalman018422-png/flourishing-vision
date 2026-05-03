import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { subscribeToTable } from "@/lib/realtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Eye,
  MousePointerClick,
  Target,
  Wallet,
  TrendingUp,
  Percent,
} from "lucide-react";

type RawReport = Record<string, any>;

type Report = {
  id: string;
  title: string;
  summary: string | null;
  ai_summary: string | null;
  report_type: string;
  file_url: string | null;
  file_path: string | null;
  file_type: string | null;
  metrics: Record<string, any>;
  week_start: string | null;
  week_end: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  raw: RawReport;
};

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "custom", label: "Custom" },
] as const;

type TypeKey = (typeof TYPE_FILTERS)[number]["key"];

export const Route = createFileRoute("/client/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "My Reports — Let Us Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

function pickFileUrl(r: RawReport): string | null {
  return (
    r.file_url ||
    r.file ||
    r.url ||
    r.report_url ||
    r.document_url ||
    null
  );
}

function normalize(r: RawReport): Report {
  return {
    id: String(r.id),
    title: String(r.title ?? "Untitled report"),
    summary: r.summary ?? null,
    ai_summary: r.ai_summary ?? null,
    report_type: String(r.report_type ?? "custom"),
    file_url: pickFileUrl(r),
    file_path: r.file_path ?? null,
    file_type: r.file_type ?? null,
    metrics: r.metrics ?? {},
    week_start: r.week_start ?? null,
    week_end: r.week_end ?? null,
    period_start: r.period_start ?? null,
    period_end: r.period_end ?? null,
    created_at: r.created_at,
    raw: r,
  };
}

function ReportsPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<TypeKey>("all");
  const [selected, setSelected] = useState<Report | null>(null);

  const load = async (uid: string) => {
    const { data, error } = await supabase
      .from("client_reports")
      .select("*")
      .eq("client_id", uid)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setReports([]);
    } else {
      setReports((data ?? []).map(normalize));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void load(userId);
    const unsub = subscribeToTable("client_reports", () => void load(userId));
    return unsub;
  }, [userId]);

  const filtered = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.report_type === filter)),
    [filter, reports],
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
              My Reports
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f) => (
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
              {reports.length === 0
                ? "No reports yet. Your team will publish reports here."
                : "No reports match this filter."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((r) => (
              <ReportCard key={r.id} report={r} onOpen={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>

      <ReportDialog report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ReportCard({ report, onOpen }: { report: Report; onOpen: () => void }) {
  const FileIcon = pickFileIcon(report.file_type);
  const typeLabel = report.report_type[0].toUpperCase() + report.report_type.slice(1);
  const range =
    fmtRange(report.week_start, report.week_end) ||
    fmtRange(report.period_start, report.period_end);

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onOpen}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            <span className="grid place-items-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">{report.title}</h3>
              <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">{typeLabel}</Badge>
                {range && (
                  <span className="text-xs text-muted-foreground">{range}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  · Sent {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <DownloadButton report={report} />
          </div>
        </div>

        <MetricsGrid metrics={report.metrics} compact />
      </CardContent>
    </Card>
  );
}

function ReportDialog({ report, onClose }: { report: Report | null; onClose: () => void }) {
  if (!report) return null;
  const range =
    fmtRange(report.week_start, report.week_end) ||
    fmtRange(report.period_start, report.period_end);
  const typeLabel = report.report_type[0].toUpperCase() + report.report_type.slice(1);
  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel}</Badge>
            {range && <span className="text-xs text-muted-foreground">{range}</span>}
            <span className="text-xs text-muted-foreground">
              Sent on {new Date(report.created_at).toLocaleString()}
            </span>
          </div>

          <MetricsGrid metrics={report.metrics} />

          {report.ai_summary && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-4 w-4" /> AI Summary
              </div>
              <p className="mt-2 text-sm whitespace-pre-line">{report.ai_summary}</p>
            </div>
          )}

          {report.summary && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Summary
              </h4>
              <p className="text-sm whitespace-pre-line">{report.summary}</p>
            </div>
          )}

          <div className="pt-2">
            <DownloadButton report={report} large />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DownloadButton({ report, large = false }: { report: Report; large?: boolean }) {
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!report.file_path && !report.file_url) {
      toast.error("No file attached to this report.");
      return;
    }
    setBusy(true);
    try {
      let href = report.file_url;
      if (report.file_path) {
        const { data, error } = await supabase.storage
          .from("client-reports")
          .createSignedUrl(report.file_path, 3600);
        if (error) throw error;
        href = data.signedUrl;
      }
      if (!href) throw new Error("No URL");
      const a = document.createElement("a");
      a.href = href;
      a.download = "";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || (!report.file_path && !report.file_url);
  return (
    <Button size={large ? "default" : "sm"} onClick={handle} disabled={disabled}>
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Download className="h-4 w-4 mr-1" /> Download
        </>
      )}
    </Button>
  );
}

const METRIC_DEFS = [
  { key: "impressions", label: "Impressions", icon: Eye, prefix: "", suffix: "" },
  { key: "clicks", label: "Clicks", icon: MousePointerClick, prefix: "", suffix: "" },
  { key: "conversions", label: "Conversions", icon: Target, prefix: "", suffix: "" },
  { key: "spend", label: "Spend", icon: Wallet, prefix: "$", suffix: "" },
  { key: "revenue", label: "Revenue", icon: TrendingUp, prefix: "$", suffix: "" },
  { key: "roi", label: "ROI", icon: Percent, prefix: "", suffix: "%" },
] as const;

function MetricsGrid({
  metrics,
  compact = false,
}: {
  metrics: Record<string, any>;
  compact?: boolean;
}) {
  const visible = METRIC_DEFS.filter((m) => metrics?.[m.key] != null);
  if (visible.length === 0) {
    return compact ? null : (
      <p className="text-sm text-muted-foreground">No metrics recorded for this report.</p>
    );
  }
  return (
    <div
      className={`grid gap-3 ${
        compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"
      }`}
    >
      {visible.map((m) => {
        const value = Number(metrics[m.key] ?? 0);
        const prev = metrics[`prev_${m.key}`];
        const prevNum = prev == null ? null : Number(prev);
        const delta = prevNum && prevNum !== 0 ? ((value - prevNum) / prevNum) * 100 : null;
        const Icon = m.icon;
        return (
          <div key={m.key} className="rounded-lg border border-border/60 bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {m.label}
              </span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mt-1 text-lg font-semibold">
              {m.prefix}
              {value.toLocaleString()}
              {m.suffix}
            </p>
            {delta != null && (
              <p
                className={`mt-0.5 inline-flex items-center gap-0.5 text-xs ${
                  delta >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {delta >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(delta).toFixed(1)}%
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function pickFileIcon(type: string | null) {
  if (!type) return FileText;
  const t = type.toLowerCase();
  if (t.includes("csv") || t.includes("xls") || t.includes("sheet")) return FileSpreadsheet;
  return FileText;
}

function fmtRange(start: string | null, end: string | null) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return "";
}
