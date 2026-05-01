import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/admin/States";
import { applyRealtimeChange, fetchWithCache, invalidateAdminCache } from "@/lib/admin-data";
import { toast } from "sonner";
import { Plus, Search, Eye, EyeOff, Loader2, Users, UserX, UserCheck } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type Client = {
  id: string;
  full_name: string;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
  membership?: {
    status: string;
    plan?: { name: string } | null;
  } | null;
};

type Plan = { id: string; name: string; price_monthly: number; price_yearly: number };

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Clients — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <ClientsPage />
    </AdminShell>
  ),
});

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async (force = false) => {
    if (force) invalidateAdminCache("admin-clients");
    if (clients.length === 0) setLoading(true);
    const list = await fetchWithCache("admin-clients", async () => {
      const { data: profiles } = await sb
        .from("client_profiles")
        .select("id,full_name,email,company_name,phone,whatsapp_number,country,avatar_url,created_at,is_active")
        .order("created_at", { ascending: false });
      const { data: memberships } = await sb
        .from("client_memberships")
        .select("client_id, status, plan:membership_plans(name)");

      const memMap = new Map<string, { status: string; plan?: { name: string } | null }>();
      (memberships ?? []).forEach((m: { client_id: string; status: string; plan: { name: string } | null }) => {
        if (!memMap.has(m.client_id)) memMap.set(m.client_id, { status: m.status, plan: m.plan });
      });

      return (profiles ?? []).map((p: Client) => ({
        ...p,
        membership: memMap.get(p.id) ?? null,
      }));
    });
    setClients(list);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await sb
      .from("membership_plans")
      .select("id,name,price_monthly,price_yearly")
      .eq("is_visible", true)
      .order("sort_order");
    setPlans(data ?? []);
  };

  useEffect(() => {
    fetchClients();
    fetchPlans();
    const profiles = sb
      .channel("admin-client-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_profiles" }, (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: Partial<Client>; old: Partial<Client> }) => {
        setClients((prev) => applyRealtimeChange(prev, payload));
      })
      .subscribe();
    const memberships = sb
      .channel("admin-client-memberships")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_memberships" }, (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: { client_id?: string; status?: string }; old: { client_id?: string } }) => {
        setClients((prev) => prev.map((c) => c.id === (payload.new.client_id ?? payload.old.client_id) ? { ...c, membership: { ...(c.membership ?? {}), status: payload.new.status ?? c.membership?.status ?? "inactive" } } : c));
      })
      .subscribe();
    return () => { sb.removeChannel(profiles); sb.removeChannel(memberships); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  return (
    <>
      <PageTitle
        title="Clients"
        action={
          <Button onClick={() => setOpenAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-0"><LoadingState rows={8} /></Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">
            {search ? "No clients match your search." : "No clients yet. Add your first client."}
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Company</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setSelectedClient(c)} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.full_name} url={c.avatar_url} />
                        <div>
                          <div className="font-medium">{c.full_name}</div>
                          <div className="text-xs text-muted-foreground">{c.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.company_name ?? "—"}</td>
                    <td className="p-3">{c.membership?.plan?.name ?? <span className="text-muted-foreground">No plan</span>}</td>
                    <td className="p-3"><StatusBadge status={c.membership?.status ?? "inactive"} /></td>
                    <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={c.full_name} url={c.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.email ?? "—"}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {c.company_name && <Badge variant="outline">{c.company_name}</Badge>}
                      {c.membership?.plan?.name && <Badge variant="outline">{c.membership.plan.name}</Badge>}
                      <StatusBadge status={c.membership?.status ?? "inactive"} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <AddClientDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        plans={plans}
        onCreated={() => fetchClients(true)}
      />
    </>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = (name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  if (url) return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    expired: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  const cls = map[status] ?? map.inactive;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
      {status === "active" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
      {status}
    </span>
  );
}

function AddClientDialog({
  open, onOpenChange, plans, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plans: Plan[];
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_name: "",
    phone: "",
    whatsapp: "",
    country: "",
    plan_id: "",
    billing_cycle: "monthly" as "monthly" | "yearly",
    start_date: new Date().toISOString().split("T")[0],
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const reset = () => setForm({
    full_name: "", email: "", password: "", company_name: "", phone: "",
    whatsapp: "", country: "", plan_id: "", billing_cycle: "monthly",
    start_date: new Date().toISOString().split("T")[0],
  });

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("Name, email and password (min 8 chars) are required");
      return;
    }
    if (!form.plan_id) {
      toast.error("Please select a plan");
      return;
    }
    setSubmitting(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone || null, company_name: form.company_name || null } },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user");

      await sb.from("client_profiles").upsert({
        id: userId,
        email: normalizedEmail,
        full_name: form.full_name.trim(),
        company_name: form.company_name || null,
        phone: form.phone || null,
        whatsapp_number: form.whatsapp || null,
        country: form.country || null,
        is_active: true,
      });

      const plan = plans.find((p) => p.id === form.plan_id);
      const startDate = new Date(form.start_date);
      const endDate = new Date(startDate);
      if (form.billing_cycle === "monthly") endDate.setMonth(endDate.getMonth() + 1);
      else endDate.setFullYear(endDate.getFullYear() + 1);
      const amount = form.billing_cycle === "monthly" ? plan?.price_monthly ?? 0 : plan?.price_yearly ?? 0;

      await sb.from("client_memberships").insert({
        client_id: userId,
        plan_id: form.plan_id,
        status: "active",
        billing_cycle: form.billing_cycle,
        amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      await sb.from("client_notifications").insert({
        client_id: userId,
        title: "Welcome to Let Us Grow!",
        body: `Your ${plan?.name ?? "plan"} is now active. Explore your dashboard to get started.`,
        type: "success",
        link: "/client/dashboard",
      });

      toast.success(`Client created! Login: ${normalizedEmail}`);
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create client";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label>Password * (min 8)</Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Plan *</Label>
            <Select value={form.plan_id} onValueChange={(v) => update("plan_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
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
              <Select
                value={form.billing_cycle}
                onValueChange={(v) => update("billing_cycle", v as "monthly" | "yearly")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
