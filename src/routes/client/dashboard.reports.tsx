import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
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

type Report = {
  id: string;
  title: string;
  summary: string | null;
  ai_summary: string | null;
  report_type: string;
  file_url: string | null;
  file_path: string | null;
  file_type: string | null;
  metrics: Record<string, number | string | null | undefined> & {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    revenue?: number;
    roi?: number;
    prev_impressions?: number;
    prev_clicks?: number;
    prev_conversions?: number;
    prev_spend?: number;
    prev_revenue?: number;
    prev_roi?: number;
  };
  week_start: string | null;
  week_end: string | null;
  created_at: string;
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

function ReportsPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<TypeKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_reports")
        .select("*")
        .eq("client_id", userId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setReports([]);
      } else {
        setReports((data ?? []) as unknown as Report[]);
      }
      setLoading(false);
    })();
  }, [userId]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? reports
        : reports.filter((r) => r.report_type === filter),
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
                ? "No reports yet. Your first report will appear here after your first week."
                : "No reports match this filter."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                expanded={expanded === r.id}
                onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  report,
  expanded,
  onToggle,
}: {
  report: Report;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!report.file_path && !report.file_url) {
      toast.error("No file attached to this report.");
      return;
    }
    setDownloading(true);
    try {
      let blob: Blob | null = null;
      let filename =
        (report.file_path?.split("/").pop() ?? `${report.title}.${report.file_type ?? "pdf"}`) ||
        "report";

      if (report.file_path) {
        const { data, error } = await supabase.storage
          .from("client-reports")
          .download(report.file_path);
        if (error) throw error;
        blob = data;
      } else if (report.file_url) {
        const res = await fetch(report.file_url);
        if (!res.ok) throw new Error("Failed to fetch file");
        blob = await res.blob();
        filename = report.file_url.split("/").pop() ?? filename;
      }

      if (!blob) throw new Error("No file data");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const typeLabel = report.report_type[0].toUpperCase() + report.report_type.slice(1);
  const FileIcon = pickFileIcon(report.file_type);

  return (
    <Card>
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
                <span className="text-xs text-muted-foreground">
                  {fmtRange(report.week_start, report.week_end) ||
                    new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onToggle}>
              {expanded ? (
                <>
                  Hide <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  View Summary <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading || (!report.file_path && !report.file_url)}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="pt-4 border-t border-border/40 space-y-5">
            <MetricsGrid metrics={report.metrics} />

            {report.ai_summary && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI Summary
                </div>
                <p className="mt-2 text-sm whitespace-pre-line">{report.ai_summary}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  This summary was generated by AI.
                </p>
              </div>
            )}

            {report.summary && !report.ai_summary && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {report.summary}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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

function MetricsGrid({ metrics }: { metrics: Report["metrics"] }) {
  const visible = METRIC_DEFS.filter((m) => metrics?.[m.key] != null);
  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No metrics recorded for this report.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {visible.map((m) => {
        const value = Number(metrics[m.key] ?? 0);
        const prev = metrics[`prev_${m.key}` as keyof Report["metrics"]];
        const prevNum = prev == null ? null : Number(prev);
        const delta =
          prevNum && prevNum !== 0 ? ((value - prevNum) / prevNum) * 100 : null;
        const Icon = m.icon;
        return (
          <div
            key={m.key}
            className="rounded-lg border border-border/60 bg-background p-3"
          >
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
  if (t.includes("csv") || t.includes("xls") || t.includes("sheet"))
    return FileSpreadsheet;
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
