import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, PageTitle, Select, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Mail, Phone, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Status = "new" | "contacted" | "closed";

type Submission = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  message: string | null;
  status: Status;
  created_at: string;
};

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-primary/15 text-primary" },
  contacted: { label: "Contacted", cls: "bg-accent/15 text-accent-foreground" },
  closed: { label: "Closed", cls: "bg-muted/50 text-muted-foreground" },
};

export const Route = createFileRoute("/admin/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <ContactsAdmin />
    </AdminShell>
  ),
});

function ContactsAdmin() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Submission | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows(((data ?? []) as Submission[]).map((r) => ({ ...r, status: (r.status as Status) ?? "new" })));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.company ?? "").toLowerCase().includes(q) ||
        (r.message ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, closed: 0 };
    rows.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  const setStatus = async (s: Submission, status: Status) => {
    setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status } : x)));
    if (open?.id === s.id) setOpen({ ...open, status });
    const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", s.id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success(`Marked as ${STATUS_META[status].label.toLowerCase()}`);
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setRows((r) => r.filter((x) => x.id !== id));
    if (open?.id === id) setOpen(null);
    setConfirmDelete(null);
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Deleted");
  };

  const exportCsv = () => {
    const cols = ["Created", "Name", "Email", "Phone", "Company", "Service", "Budget", "Status", "Message"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      cols.join(","),
      ...filtered.map((r) =>
        [
          new Date(r.created_at).toISOString(),
          r.full_name,
          r.email,
          r.phone ?? "",
          r.company ?? "",
          r.service ?? "",
          r.budget ?? "",
          STATUS_META[r.status].label,
          r.message ?? "",
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} rows`);
  };

  return (
    <>
      <PageTitle
        title="Contact submissions"
        action={
          <Button variant="ghost" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company, message…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | Status)} className="sm:w-48">
          <option value="all">All ({rows.length})</option>
          <option value="new">New ({counts.new})</option>
          <option value="contacted">Contacted ({counts.contacted})</option>
          <option value="closed">Closed ({counts.closed})</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No submissions yet." : "Nothing matches this filter."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium p-3">Name</th>
                    <th className="text-left font-medium p-3">Email</th>
                    <th className="text-left font-medium p-3">Service</th>
                    <th className="text-left font-medium p-3">Budget</th>
                    <th className="text-left font-medium p-3">Status</th>
                    <th className="text-left font-medium p-3">Date</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/20 transition cursor-pointer"
                      onClick={() => setOpen(s)}
                    >
                      <td className="p-3 font-medium truncate max-w-[180px]">{s.full_name}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-[200px]">{s.email}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-[140px]">{s.service ?? "—"}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-[120px]">{s.budget ?? "—"}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_META[s.status].cls}`}>
                          {STATUS_META[s.status].label}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="danger" onClick={() => setConfirmDelete(s)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-border/60">
              {filtered.map((s) => (
                <li key={s.id} className="p-4" onClick={() => setOpen(s)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{s.full_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_META[s.status].cls}`}>
                          {STATUS_META[s.status].label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {[s.service, s.budget].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.full_name ?? "Contact"}
        size="md"
      >
        {open && (
          <div className="space-y-5">
            <div className="space-y-2 text-sm">
              <a href={`mailto:${open.email}`} className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" /> {open.email}
              </a>
              {open.phone && (
                <a href={`tel:${open.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" /> {open.phone}
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground uppercase tracking-wide">Company</div>
                <div className="mt-0.5">{open.company ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wide">Service</div>
                <div className="mt-0.5">{open.service ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wide">Budget</div>
                <div className="mt-0.5">{open.budget ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wide">Submitted</div>
                <div className="mt-0.5">{new Date(open.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Message</div>
              <div className="glass rounded-xl p-3 text-sm whitespace-pre-wrap">{open.message ?? "—"}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_META) as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(open, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      open.status === s ? STATUS_META[s].cls : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="danger" type="button" onClick={() => setConfirmDelete(open)}>
              <Trash2 className="h-4 w-4" /> Delete submission
            </Button>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete submission?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
