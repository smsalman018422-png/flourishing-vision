import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, Eye, EyeOff, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Project = {
  id: string;
  project_title: string;
  client_name: string;
  category: string;
  service_type: string | null;
  slug: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  challenge: string | null;
  solution: string | null;
  results: string | null;
  roi_pct: number | null;
  growth_pct: number | null;
  revenue_label: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
};

const SERVICE_TYPES = [
  { v: "social-media", l: "Social Media" },
  { v: "paid-ads", l: "Paid Ads" },
  { v: "seo", l: "SEO" },
  { v: "branding", l: "Branding" },
  { v: "design", l: "Design" },
];

const empty = (): Project => ({
  id: "",
  project_title: "",
  client_name: "",
  category: "",
  service_type: "social-media",
  slug: null,
  cover_image_url: null,
  gallery_images: [],
  challenge: "",
  solution: "",
  results: "",
  roi_pct: null,
  growth_pct: null,
  revenue_label: "",
  testimonial_quote: "",
  testimonial_author: "",
  testimonial_role: "",
  is_visible: true,
  is_featured: false,
  sort_order: 0,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export const Route = createFileRoute("/admin/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <PortfolioAdmin />
    </AdminShell>
  ),
});

function PortfolioAdmin() {
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as Project[]).map((r) => ({ ...r, gallery_images: r.gallery_images ?? [] })));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.service_type === filter)),
    [rows, filter],
  );

  const save = async () => {
    if (!editing) return;
    if (!editing.project_title.trim() || !editing.client_name.trim()) {
      toast.error("Title and client are required");
      return;
    }
    setBusy(true);
    const payload = {
      project_title: editing.project_title.trim(),
      client_name: editing.client_name.trim(),
      category: (editing.category || editing.service_type || "general").trim(),
      service_type: editing.service_type,
      slug: editing.slug?.trim() || slugify(editing.project_title),
      cover_image_url: editing.cover_image_url,
      gallery_images: editing.gallery_images,
      challenge: editing.challenge?.trim() || null,
      solution: editing.solution?.trim() || null,
      results: editing.results?.trim() || null,
      roi_pct: editing.roi_pct,
      growth_pct: editing.growth_pct,
      revenue_label: editing.revenue_label?.trim() || null,
      testimonial_quote: editing.testimonial_quote?.trim() || null,
      testimonial_author: editing.testimonial_author?.trim() || null,
      testimonial_role: editing.testimonial_role?.trim() || null,
      is_visible: editing.is_visible,
      is_featured: editing.is_featured,
    };
    const isNew = !editing.id;
    const { error } = isNew
      ? await supabase.from("portfolio").insert({ ...payload, sort_order: rows.length })
      : await supabase.from("portfolio").update(payload).eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? "Case study added" : "Saved");
    setEditing(null);
    load();
  };

  const toggle = async (p: Project, key: "is_visible" | "is_featured") => {
    const next = !p[key];
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, [key]: next } : x)));
    const patch = key === "is_visible" ? { is_visible: next } : { is_featured: next };
    const { error } = await supabase.from("portfolio").update(patch).eq("id", p.id);
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
    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Removed");
  };

  return (
    <>
      <PageTitle
        title="Portfolio"
        action={
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4" /> Add case study
          </Button>
        }
      />

      <div className="-mx-1 mb-4 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max">
          {[{ v: "all", l: "All" }, ...SERVICE_TYPES].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === t.v ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No case studies in this view.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition">
                <div className="h-14 w-20 sm:h-16 sm:w-24 rounded-lg overflow-hidden bg-muted/30 shrink-0 grid place-items-center">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.project_title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No cover</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium truncate">{p.project_title}</span>
                    {p.is_featured && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                    {!p.is_visible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.client_name} · {SERVICE_TYPES.find((s) => s.v === p.service_type)?.l ?? p.category}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggle(p, "is_featured")}
                    aria-label="Toggle featured"
                    title="Featured"
                    className={`grid place-items-center h-9 w-9 rounded-lg hover:bg-muted/40 ${p.is_featured ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggle(p, "is_visible")}
                    aria-label="Toggle visibility"
                    title="Visibility"
                    className="grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    {p.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <Button variant="ghost" onClick={() => setEditing(p)} aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(p)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit case study" : "New case study"}
        onSubmit={save}
        busy={busy}
        size="xl"
      >
        {editing && (
          <div className="space-y-5">
            <Field label="Cover image (16:9)">
              <ImageUpload
                value={editing.cover_image_url}
                onChange={(url) => setEditing({ ...editing, cover_image_url: url })}
                bucket="portfolio-images"
                folder="covers"
                aspectClass="aspect-video"
                label="Cover"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Project title">
                <TextInput
                  required
                  value={editing.project_title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEditing({
                      ...editing,
                      project_title: t,
                      slug: editing.id ? editing.slug : slugify(t),
                    });
                  }}
                />
              </Field>
              <Field label="Client name">
                <TextInput
                  required
                  value={editing.client_name}
                  onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Service type">
                <Select
                  value={editing.service_type ?? ""}
                  onChange={(e) => setEditing({ ...editing, service_type: e.target.value })}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Slug (URL)">
                <TextInput
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  placeholder="auto-generated from title"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="ROI %">
                <TextInput
                  type="number"
                  value={editing.roi_pct ?? ""}
                  onChange={(e) => setEditing({ ...editing, roi_pct: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="320"
                />
              </Field>
              <Field label="Growth %">
                <TextInput
                  type="number"
                  value={editing.growth_pct ?? ""}
                  onChange={(e) => setEditing({ ...editing, growth_pct: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="140"
                />
              </Field>
              <Field label="Revenue label">
                <TextInput
                  value={editing.revenue_label ?? ""}
                  onChange={(e) => setEditing({ ...editing, revenue_label: e.target.value })}
                  placeholder="$1.2M ARR"
                />
              </Field>
            </div>

            <Field label="Challenge">
              <TextArea value={editing.challenge ?? ""} onChange={(e) => setEditing({ ...editing, challenge: e.target.value })} />
            </Field>
            <Field label="Solution">
              <TextArea value={editing.solution ?? ""} onChange={(e) => setEditing({ ...editing, solution: e.target.value })} />
            </Field>
            <Field label="Results">
              <TextArea value={editing.results ?? ""} onChange={(e) => setEditing({ ...editing, results: e.target.value })} />
            </Field>

            <Field label="Gallery images">
              <MultiImageUpload
                values={editing.gallery_images}
                onChange={(urls) => setEditing({ ...editing, gallery_images: urls })}
                bucket="portfolio-images"
                folder="gallery"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Testimonial author">
                <TextInput
                  value={editing.testimonial_author ?? ""}
                  onChange={(e) => setEditing({ ...editing, testimonial_author: e.target.value })}
                />
              </Field>
              <Field label="Testimonial role">
                <TextInput
                  value={editing.testimonial_role ?? ""}
                  onChange={(e) => setEditing({ ...editing, testimonial_role: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Testimonial quote">
              <TextArea
                value={editing.testimonial_quote ?? ""}
                onChange={(e) => setEditing({ ...editing, testimonial_quote: e.target.value })}
              />
            </Field>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={editing.is_featured}
                  onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                />
                Featured
              </label>
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
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete case study?"
        description={confirmDelete ? `“${confirmDelete.project_title}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
