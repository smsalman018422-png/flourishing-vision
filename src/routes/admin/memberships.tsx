import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Crown, CalendarPlus, RefreshCw, X as XIcon, ArrowRightLeft } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type Plan = { id: string; name: string; price_monthly: number; price_yearly: number };
type Membership = {
  id: string;
  client_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  billing_cycle: string;
  auto_renew: boolean;
  cancelled_at: string | null;
  plan?: { name: string } | null;
  client?: { full_name: string; email: string | null } | null;
};

export const Route = createFileRoute("/admin/memberships")({
  head: () => ({ meta: [{ title: "Memberships — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <MembershipsPage />
    </AdminShell>
  ),
});

const FILTERS = ["all", "active", "expired", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function MembershipsPage() {
  const [items, setItems] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ kind: "extend" | "change" | "renew"; row: Membership } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await sb
      .from("client_memberships")
      .select("*, plan:membership_plans(name), client:client_profiles(full_name,email)")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    sb.from("membership_plans").select("id,name,price_monthly,price_yearly").order("sort_order").then(
      ({ data }: { data: Plan[] | null }) => setPlans(data ?? []),
    );
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((m) => m.status === filter)),
    [items, filter],
  );

  const cancel = async (m: Membership) => {
    if (!confirm("Cancel this membership?")) return;
    const { error } = await sb
      .from("client_memberships")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", m.id);
    if (error) toast.error(error.message);
    else { toast.success("Cancelled"); fetchData(); }
  };

  return (
    <>
      <PageTitle title="Memberships" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">No memberships in this view.</div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border/60">
              <tr>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Cycle</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Period</th>
                <th className="text-left p-3">Auto-renew</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{m.client?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.client?.email ?? ""}</div>
                  </td>
                  <td className="p-3">{m.plan?.name ?? "—"}</td>
                  <td className="p-3"><StatusPill status={m.status} /></td>
                  <td className="p-3 capitalize">{m.billing_cycle}</td>
                  <td className="p-3">${m.amount}</td>
                  <td className="p-3 text-xs">
                    {new Date(m.start_date).toLocaleDateString()} → {new Date(m.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{m.auto_renew ? "Yes" : "No"}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "extend", row: m })} title="Extend">
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "change", row: m })} title="Change Plan">
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "renew", row: m })} title="Renew">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {m.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(m)} title="Cancel" className="text-destructive">
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <ActionDialog
          action={editing}
          plans={plans}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchData(); }}
        />
      )}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const m: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    expired: "bg-red-500/15 text-red-400",
    cancelled: "bg-zinc-500/15 text-zinc-400",
  };
  return <Badge className={m[status] ?? m.cancelled}>{status}</Badge>;
}

function ActionDialog({
  action, plans, onClose, onSaved,
}: {
  action: { kind: "extend" | "change" | "renew"; row: Membership };
  plans: Plan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const m = action.row;
  const [submitting, setSubmitting] = useState(false);
  const [endDate, setEndDate] = useState(m.end_date.split("T")[0]);
  const [planId, setPlanId] = useState(m.plan_id);
  const [cycle, setCycle] = useState<"monthly" | "yearly">((m.billing_cycle as "monthly" | "yearly") || "monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (action.kind === "extend") {
        const { error } = await sb.from("client_memberships").update({ end_date: new Date(endDate).toISOString() }).eq("id", m.id);
        if (error) throw error;
        toast.success("End date updated");
      } else if (action.kind === "change") {
        const plan = plans.find((p) => p.id === planId);
        const amount = cycle === "monthly" ? plan?.price_monthly ?? 0 : plan?.price_yearly ?? 0;
        const start = new Date(startDate);
        const end = new Date(start);
        if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
        else end.setFullYear(end.getFullYear() + 1);
        const { error } = await sb.from("client_memberships").update({
          plan_id: planId, billing_cycle: cycle, amount,
          start_date: start.toISOString(), end_date: end.toISOString(), status: "active",
        }).eq("id", m.id);
        if (error) throw error;
        toast.success("Plan changed");
      } else {
        // renew = create new record
        const plan = plans.find((p) => p.id === planId);
        const amount = cycle === "monthly" ? plan?.price_monthly ?? 0 : plan?.price_yearly ?? 0;
        const start = new Date(startDate);
        const end = new Date(start);
        if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
        else end.setFullYear(end.getFullYear() + 1);
        const { error } = await sb.from("client_memberships").insert({
          client_id: m.client_id, plan_id: planId, billing_cycle: cycle, amount,
          start_date: start.toISOString(), end_date: end.toISOString(), status: "active",
        });
        if (error) throw error;
        toast.success("Renewed");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const titleMap = { extend: "Extend Membership", change: "Change Plan", renew: "Renew Membership" };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{titleMap[action.kind]}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {action.kind === "extend" ? (
            <div>
              <Label>New End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <Label>Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ${p.price_monthly}/mo · ${p.price_yearly}/yr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Billing Cycle</Label>
                  <Select value={cycle} onValueChange={(v) => setCycle(v as "monthly" | "yearly")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
