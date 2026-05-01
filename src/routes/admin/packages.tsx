import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Button,
  Card,
  Field,
  PageTitle,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/States";
import { adminData, adminWrite } from "@/lib/admin-data";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type FeatureItem = { text: string; type: "feature" | "bonus" };

type Pkg = {
  id: string;
  category: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  tagline: string | null;
  description: string | null;
  icon_name: string;
  features: FeatureItem[];
  best_for: string | null;
  is_popular: boolean;
  is_premium: boolean;
  is_visible: boolean;
  order_index: number;
  cta_text: string;
  cta_link: string;
};

const CATEGORIES = [
  { v: "social_media", l: "Social Media" },
  { v: "web_development", l: "Web Development" },
  { v: "creator", l: "Creator" },
  { v: "custom", l: "Custom" },
];

const ICONS = [
  "Sparkles", "Sprout", "Rocket", "Shield", "Crown", "Star", "Zap",
  "TrendingUp", "Target", "Layers", "Award", "Diamond", "Flame", "Gem",
  "Heart", "Trophy", "Briefcase", "Globe", "Code", "Palette",
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);

const empty = (): Pkg => ({
  id: "",
  category: "social_media",
  name: "",
  slug: "",
  price_monthly: 0,
  price_yearly: 0,
  tagline: "",
  description: "",
  icon_name: "Sparkles",
  features: [],
  best_for: "",
  is_popular: false,
  is_premium: false,
  is_visible: true,
  order_index: 0,
  cta_text: "Get Started",
  cta_link: "/contact",
});

export const Route = createFileRoute("/admin/packages")({
  head: () => ({ meta: [{ title: "Packages — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <PackagesAdmin />
    </AdminShell>
  ),
});

type PendingRequest = {
  id: string;
  client_id: string;
  package_id: string;
  billing_cycle: string;
  amount: number;
  status: string;
  created_at: string;
  package?: { name: string } | null;
  client?: { full_name: string; email: string | null } | null;
};

function PendingApprovals() {
  const [rows, setRows] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = (await import("@/integrations/supabase/client")).supabase as any;
    const { data } = await sb
      .from("package_purchase_requests")
      .select("*, package:packages(name), client:client_profiles(full_name,email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setup = async () => {
      const { supabase: sb } = await import("@/integrations/supabase/client");
      const channel = sb
        .channel("admin-purchase-requests")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "package_purchase_requests" },
          () => load(),
        )
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    };
    let cleanup: (() => void) | undefined;
    setup().then((c) => (cleanup = c));
    return () => cleanup?.();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const { supabase: sb } = await import("@/integrations/supabase/client");
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/purchase-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request_id: id, action }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        toast.error(body?.error || "Action failed");
      } else {
        toast.success(action === "approve" ? "Package activated" : "Request rejected");
        load();
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <Card className="p-4 mb-5 border-primary/40 bg-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Pending Approvals</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
          {rows.length}
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border/60 bg-background"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {r.client?.full_name ?? "Unknown client"}
                <span className="text-muted-foreground"> · {r.client?.email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.package?.name ?? "Package"} · {r.billing_cycle} · ${r.amount} ·{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => act(r.id, "approve")}
                disabled={busyId === r.id}
              >
                Approve
              </Button>
              <Button
                variant="ghost"
                onClick={() => act(r.id, "reject")}
                disabled={busyId === r.id}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PackagesAdmin() {
  const [rows, setRows] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Pkg | null>(null);
  const [busy, setBusy] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [bulkPaste, setBulkPaste] = useState("");
  const [bulkType, setBulkType] = useState<"feature" | "bonus">("feature");

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const res = await adminData<Pkg>({
      table: "packages",
      orders: [{ column: "category" }, { column: "order_index" }],
    });
    if (res.error) setLoadError(res.error);
    else setRows((res.data ?? []).map((p) => ({ ...p, features: normalizeFeatures(p.features) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filterCategory === "all" ? rows : rows.filter((r) => r.category === filterCategory)),
    [rows, filterCategory],
  );

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name is required");
    const slug = editing.slug.trim() || slugify(editing.name);
    setBusy(true);
    const payload = {
      category: editing.category,
      name: editing.name.trim(),
      slug,
      price_monthly: Number(editing.price_monthly) || 0,
      price_yearly: Number(editing.price_yearly) || 0,
      tagline: editing.tagline || "",
      description: editing.description || "",
      icon_name: editing.icon_name || "Sparkles",
      features: editing.features.filter((f) => f.text.trim()),
      best_for: editing.best_for || "",
      is_popular: editing.is_popular,
      is_premium: editing.is_premium,
      is_visible: editing.is_visible,
      order_index: Number(editing.order_index) || 0,
      cta_text: editing.cta_text || "Get Started",
      cta_link: editing.cta_link || "/contact",
    };
    const res = editing.id
      ? await adminWrite({
          table: "packages",
          op: "update",
          values: payload,
          match: [{ column: "id", value: editing.id }],
        })
      : await adminWrite({ table: "packages", op: "insert", values: payload });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(editing.id ? "Package updated" : "Package created");
    setEditing(null);
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    const res = await adminWrite({
      table: "packages",
      op: "delete",
      match: [{ column: "id", value: confirmDelete.id }],
    });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Package deleted");
    setConfirmDelete(null);
    load();
  };

  const toggleVisible = async (p: Pkg) => {
    const res = await adminWrite({
      table: "packages",
      op: "update",
      values: { is_visible: !p.is_visible },
      match: [{ column: "id", value: p.id }],
    });
    if (res.error) return toast.error(res.error);
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, is_visible: !r.is_visible } : r)));
  };

  const updateField = <K extends keyof Pkg>(k: K, v: Pkg[K]) =>
    setEditing((e) => (e ? { ...e, [k]: v } : e));

  const addFeature = () =>
    setEditing((e) =>
      e ? { ...e, features: [...e.features, { text: "", type: "feature" }] } : e,
    );

  const updateFeature = (i: number, patch: Partial<FeatureItem>) =>
    setEditing((e) =>
      e
        ? {
            ...e,
            features: e.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
          }
        : e,
    );

  const removeFeature = (i: number) =>
    setEditing((e) => (e ? { ...e, features: e.features.filter((_, idx) => idx !== i) } : e));

  const moveFeature = (i: number, dir: -1 | 1) =>
    setEditing((e) => {
      if (!e) return e;
      const next = [...e.features];
      const j = i + dir;
      if (j < 0 || j >= next.length) return e;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...e, features: next };
    });

  const applyBulkPaste = () => {
    const lines = bulkPaste.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setEditing((e) =>
      e
        ? {
            ...e,
            features: [
              ...e.features,
              ...lines.map((text) => ({ text, type: bulkType })),
            ],
          }
        : e,
    );
    setBulkPaste("");
    toast.success(`Added ${lines.length} ${bulkType}${lines.length === 1 ? "" : "s"}`);
  };

  return (
    <div>
      <PageTitle
        title="Packages"
        action={
          <Button
            onClick={() => {
              const next = empty();
              next.order_index = (rows[rows.length - 1]?.order_index ?? 0) + 1;
              setEditing(next);
            }}
          >
            <Plus className="h-4 w-4" /> Add Package
          </Button>
        }
      />

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        <CategoryChip label="All" active={filterCategory === "all"} onClick={() => setFilterCategory("all")} />
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.v}
            label={c.l}
            active={filterCategory === c.v}
            onClick={() => setFilterCategory(c.v)}
          />
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No packages yet — click Add Package to create your first one."
          actionLabel="Add Package"
          onAction={() => {
            const next = empty();
            next.order_index = (rows[rows.length - 1]?.order_index ?? 0) + 1;
            setEditing(next);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {p.is_popular && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary uppercase">
                        Popular
                      </span>
                    )}
                    {p.is_premium && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 uppercase">
                        Premium
                      </span>
                    )}
                    {!p.is_visible && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {CATEGORIES.find((c) => c.v === p.category)?.l ?? p.category} ·{" "}
                    <span className="text-foreground/80 font-medium">${p.price_monthly}/mo</span> ·{" "}
                    <span>${p.price_yearly}/yr</span> · {p.features.length} features
                  </p>
                  {p.tagline && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{p.tagline}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVisible(p)}
                    className="p-2 rounded-lg hover:bg-muted"
                    title={p.is_visible ? "Hide" : "Show"}
                  >
                    {p.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditing({ ...p, features: normalizeFeatures(p.features) })}
                    className="p-2 rounded-lg hover:bg-muted"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Package" : "New Package"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save Package"}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category">
                <Select
                  value={editing.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.v} value={c.v}>
                      {c.l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Icon">
                <Select
                  value={editing.icon_name}
                  onChange={(e) => updateField("icon_name", e.target.value)}
                >
                  {ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Package Name">
              <TextInput
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditing((cur) =>
                    cur
                      ? {
                          ...cur,
                          name,
                          slug: cur.slug && cur.id ? cur.slug : slugify(name),
                        }
                      : cur,
                  );
                }}
                placeholder="Starter Growth"
              />
            </Field>

            <Field label="Slug">
              <TextInput
                value={editing.slug}
                onChange={(e) => updateField("slug", slugify(e.target.value))}
                placeholder="starter-growth"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Monthly Price ($)">
                <TextInput
                  type="number"
                  value={String(editing.price_monthly)}
                  onChange={(e) => {
                    const m = Number(e.target.value) || 0;
                    setEditing((cur) =>
                      cur
                        ? {
                            ...cur,
                            price_monthly: m,
                            price_yearly:
                              cur.price_yearly && cur.id ? cur.price_yearly : Math.round(m * 12 * 0.8),
                          }
                        : cur,
                    );
                  }}
                />
              </Field>
              <Field label="Yearly Price ($)">
                <TextInput
                  type="number"
                  value={String(editing.price_yearly)}
                  onChange={(e) => updateField("price_yearly", Number(e.target.value) || 0)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Suggested: ${Math.round(editing.price_monthly * 12 * 0.8).toLocaleString()} (20% off
                  yearly)
                </p>
              </Field>
            </div>

            <Field label="Tagline">
              <TextInput
                value={editing.tagline ?? ""}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="Perfect for local businesses…"
              />
            </Field>

            <Field label="Description (optional)">
              <TextArea
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </Field>

            <Field label="Best For (comma separated)">
              <TextInput
                value={editing.best_for ?? ""}
                onChange={(e) => updateField("best_for", e.target.value)}
                placeholder="Restaurants, Local Shops, Startups"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="CTA Text">
                <TextInput
                  value={editing.cta_text}
                  onChange={(e) => updateField("cta_text", e.target.value)}
                />
              </Field>
              <Field label="CTA Link">
                <TextInput
                  value={editing.cta_link}
                  onChange={(e) => updateField("cta_link", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ToggleField
                label="Popular"
                checked={editing.is_popular}
                onChange={(v) => updateField("is_popular", v)}
              />
              <ToggleField
                label="Premium (gold)"
                checked={editing.is_premium}
                onChange={(v) => updateField("is_premium", v)}
              />
              <ToggleField
                label="Visible"
                checked={editing.is_visible}
                onChange={(v) => updateField("is_visible", v)}
              />
              <Field label="Order">
                <TextInput
                  type="number"
                  value={String(editing.order_index)}
                  onChange={(e) => updateField("order_index", Number(e.target.value) || 0)}
                />
              </Field>
            </div>

            {/* Features editor */}
            <div className="border-t border-border/60 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold">Features</h4>
                  <p className="text-xs text-muted-foreground">
                    {editing.features.filter((f) => f.type === "feature").length} features ·{" "}
                    {editing.features.filter((f) => f.type === "bonus").length} bonuses
                  </p>
                </div>
                <Button variant="ghost" onClick={addFeature}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {editing.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className="p-1 hover:bg-muted rounded"
                        onClick={() => moveFeature(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-muted rounded"
                        onClick={() => moveFeature(i, 1)}
                        disabled={i === editing.features.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <TextInput
                      value={f.text}
                      onChange={(e) => updateFeature(i, { text: e.target.value })}
                      placeholder="Feature text"
                    />
                    <Select
                      value={f.type}
                      onChange={(e) =>
                        updateFeature(i, { type: e.target.value as "feature" | "bonus" })
                      }
                      className="w-28 shrink-0"
                    >
                      <option value="feature">Feature</option>
                      <option value="bonus">Bonus</option>
                    </Select>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-destructive/10 text-destructive shrink-0"
                      onClick={() => removeFeature(i)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {editing.features.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    No features yet. Add one or paste below.
                  </p>
                )}
              </div>

              {/* Bulk paste */}
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Bulk paste
                  </p>
                  <Select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as "feature" | "bonus")}
                    className="w-28 h-8 text-xs"
                  >
                    <option value="feature">Features</option>
                    <option value="bonus">Bonuses</option>
                  </Select>
                </div>
                <TextArea
                  rows={3}
                  value={bulkPaste}
                  onChange={(e) => setBulkPaste(e.target.value)}
                  placeholder="One item per line — paste your features here"
                />
                <Button variant="ghost" onClick={applyBulkPaste} className="mt-2">
                  Add to list
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete package?"
        description={`This will permanently delete "${confirmDelete?.name}".`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await remove();
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label={label}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-9 px-3 rounded-md border text-sm font-medium transition ${
          checked
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border"
        }`}
      >
        {checked ? "On" : "Off"}
      </button>
    </Field>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function normalizeFeatures(raw: unknown): FeatureItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { text: item, type: "feature" as const };
      if (item && typeof item === "object") {
        const obj = item as { text?: unknown; type?: unknown };
        const text = typeof obj.text === "string" ? obj.text : "";
        const type = obj.type === "bonus" ? "bonus" : "feature";
        return { text, type } as FeatureItem;
      }
      return null;
    })
    .filter((f): f is FeatureItem => !!f && !!f.text);
}
