import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SortableList } from "@/components/admin/SortableList";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, Eye, EyeOff, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string | null;
  icon_name: string;
  features: string[];
  starts_at_price: number | null;
  service_type: string | null;
  order_index: number;
  is_visible: boolean;
};

const ICONS = [
  "Sparkles", "TrendingUp", "Megaphone", "Search", "Palette", "PenTool",
  "Camera", "Video", "BarChart3", "Target", "Rocket", "Zap", "Globe",
  "ShoppingBag", "Mail", "Users", "Layers", "Brush", "Code", "Smartphone",
];

const SERVICE_TYPES = [
  { v: "social-media", l: "Social Media" },
  { v: "paid-ads", l: "Paid Ads" },
  { v: "seo", l: "SEO" },
  { v: "branding", l: "Branding" },
  { v: "design", l: "Design" },
  { v: "content", l: "Content" },
  { v: "strategy", l: "Strategy" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);

const empty = (): Service => ({
  id: "",
  slug: "",
  title: "",
  short_description: "",
  long_description: "",
  icon_name: "Sparkles",
  features: [],
  starts_at_price: null,
  service_type: "social-media",
  order_index: 0,
  is_visible: true,
});

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <ServicesAdmin />
    </AdminShell>
  ),
});

function ServicesAdmin() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) {
      // Transient schema-cache hiccups return PGRST002. Retry quietly once.
      const isTransient = (error as { code?: string }).code === "PGRST002";
      if (isTransient) {
        await new Promise((r) => setTimeout(r, 1500));
        const retry = await supabase.from("services").select("*").order("order_index", { ascending: true });
        if (!retry.error) {
          setRows(((retry.data ?? []) as Service[]).map((s) => ({ ...s, features: s.features ?? [] })));
          setLoading(false);
          return;
        }
      }
      toast.error(error.message);
    }
    setRows(((data ?? []) as Service[]).map((s) => ({ ...s, features: s.features ?? [] })));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim() || !editing.short_description.trim()) {
      toast.error("Title, slug, and short description are required");
      return;
    }
    setBusy(true);
    const payload = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      short_description: editing.short_description.trim(),
      long_description: editing.long_description?.trim() || null,
      icon_name: editing.icon_name || "Sparkles",
      features: editing.features,
      starts_at_price: editing.starts_at_price,
      service_type: editing.service_type,
      is_visible: editing.is_visible,
    };
    const isNew = !editing.id;
    const { error } = isNew
      ? await supabase.from("services").insert({ ...payload, order_index: rows.length })
      : await supabase.from("services").update(payload).eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? "Service added" : "Saved");
    setEditing(null);
    load();
  };

  const toggleVisibility = async (s: Service) => {
    const next = !s.is_visible;
    setRows((r) => r.map((x) => (x.id === s.id ? { ...x, is_visible: next } : x)));
    const { error } = await supabase.from("services").update({ is_visible: next }).eq("id", s.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setRows((r) => r.filter((x) => x.id !== id));
    setConfirmDelete(null);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Removed");
  };

  const onReorder = async (next: Service[]) => {
    setRows(next);
    const updates = next.map((s, i) => supabase.from("services").update({ order_index: i }).eq("id", s.id));
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Some rows failed to reorder");
  };

  const addFeature = () => {
    if (!editing || !newFeature.trim()) return;
    setEditing({ ...editing, features: [...editing.features, newFeature.trim()] });
    setNewFeature("");
  };

  return (
    <>
      <PageTitle
        title="Services"
        action={
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4" /> Add service
          </Button>
        }
      />
      <div className="text-xs text-muted-foreground mb-3">Drag handle to reorder how they appear on the site.</div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No services yet.</div>
        ) : (
          <SortableList
            items={rows}
            onReorder={onReorder}
            renderItem={(s) => (
              <div className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/20 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium truncate">{s.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono">/{s.slug}</span>
                    {!s.is_visible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.short_description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVisibility(s)}
                    aria-label="Toggle visibility"
                    className="grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    {s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <Button variant="ghost" onClick={() => setEditing({ ...s, features: s.features ?? [] })} aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(s)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </Card>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit service" : "New service"}
        onSubmit={save}
        busy={busy}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title">
                <TextInput
                  required
                  value={editing.title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEditing({ ...editing, title: t, slug: editing.id ? editing.slug : slugify(t) });
                  }}
                />
              </Field>
              <Field label="Slug (URL)">
                <TextInput
                  required
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Short description">
              <TextInput
                required
                value={editing.short_description}
                onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                placeholder="One line that appears on cards"
              />
            </Field>
            <Field label="Full description">
              <TextArea
                value={editing.long_description ?? ""}
                onChange={(e) => setEditing({ ...editing, long_description: e.target.value })}
                placeholder="Shown on the service detail page"
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Icon">
                <Select value={editing.icon_name} onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })}>
                  {ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Service type">
                <Select
                  value={editing.service_type ?? ""}
                  onChange={(e) => setEditing({ ...editing, service_type: e.target.value })}
                >
                  <option value="">—</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Starts at (USD)">
                <TextInput
                  type="number"
                  value={editing.starts_at_price ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      starts_at_price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="2500"
                />
              </Field>
            </div>

            <Field label="Features">
              <div className="space-y-2">
                {editing.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {editing.features.map((f, i) => (
                      <li key={`${f}-${i}`} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm">
                        <span className="flex-1 truncate">{f}</span>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, features: editing.features.filter((_, x) => x !== i) })}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove feature"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <TextInput
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="Add a feature and press Enter"
                  />
                  <Button type="button" onClick={addFeature}>
                    Add
                  </Button>
                </div>
              </div>
            </Field>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={editing.is_visible}
                onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })}
              />
              Visible on site
            </label>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete service?"
        description={confirmDelete ? `“${confirmDelete.title}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
