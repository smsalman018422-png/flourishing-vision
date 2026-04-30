import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, TextArea, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SortableList } from "@/components/admin/SortableList";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/States";
import { adminData, adminWrite } from "@/lib/admin-data";
import { subscribeToTable } from "@/lib/realtime";
import { Edit2, Plus, Star, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  author_name: string;
  author_role: string;
  company: string;
  quote: string;
  rating: number;
  photo_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  sort_order: number;
};

const empty = (): Testimonial => ({
  id: "",
  author_name: "",
  author_role: "",
  company: "",
  quote: "",
  rating: 5,
  photo_url: null,
  video_url: "",
  video_thumbnail_url: "",
  sort_order: 0,
});

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <TestimonialsAdmin />
    </AdminShell>
  ),
});

function TestimonialsAdmin() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await adminData<Testimonial>({
      table: "testimonials",
      select: "*",
      orders: [{ column: "sort_order", ascending: true }],
    });
    if (error) {
      setLoadError(error);
      setLoading(false);
      return;
    }
    setRows(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
    return subscribeToTable("testimonials", load, "admin-testimonials-changes");
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.author_name.trim() || !editing.quote.trim()) {
      toast.error("Name and quote are required");
      return;
    }
    setBusy(true);
    const payload = {
      author_name: editing.author_name.trim(),
      author_role: editing.author_role.trim(),
      company: editing.company.trim(),
      quote: editing.quote.trim(),
      rating: Math.max(1, Math.min(5, editing.rating || 5)),
      photo_url: editing.photo_url,
      video_url: editing.video_url?.trim() || null,
      video_thumbnail_url: editing.video_thumbnail_url?.trim() || null,
    };
    const isNew = !editing.id;
    const { error } = isNew
      ? await adminWrite({ table: "testimonials", op: "insert", values: { ...payload, sort_order: rows.length } })
      : await adminWrite({ table: "testimonials", op: "update", values: payload, match: [{ column: "id", value: editing.id }] });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(isNew ? "Testimonial added" : "Saved");
    setEditing(null);
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setRows((r) => r.filter((x) => x.id !== id));
    setConfirmDelete(null);
    const { error } = await adminWrite({ table: "testimonials", op: "delete", match: [{ column: "id", value: id }] });
    if (error) {
      toast.error(error);
      load();
    } else toast.success("Removed");
  };

  const onReorder = async (next: Testimonial[]) => {
    setRows(next);
    const updates = next.map((t, i) => adminWrite({ table: "testimonials", op: "update", values: { sort_order: i }, match: [{ column: "id", value: t.id }] }));
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Some rows failed to reorder");
  };

  return (
    <>
      <PageTitle
        title="Testimonials"
        action={
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4" /> Add testimonial
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title="No testimonials yet." actionLabel="Add your first testimonial" onAction={() => setEditing(empty())} />
        ) : (
          <SortableList
            items={rows}
            onReorder={onReorder}
            renderItem={(t) => (
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted/30 shrink-0 grid place-items-center">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.author_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t.author_name[0]}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium truncate">{t.author_name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {t.author_role}{t.company ? ` · ${t.company}` : ""}
                    </span>
                    {t.video_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate italic">“{t.quote}”</div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < t.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" onClick={() => setEditing(t)} aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(t)} aria-label="Delete">
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
        title={editing?.id ? "Edit testimonial" : "New testimonial"}
        onSubmit={save}
        busy={busy}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Photo">
              <ImageUpload
                value={editing.photo_url}
                onChange={(url) => setEditing({ ...editing, photo_url: url })}
                bucket="testimonial-photos"
                aspectClass="aspect-square max-w-[160px]"
                label="Photo"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Author name">
                <TextInput required value={editing.author_name} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
              </Field>
              <Field label="Role">
                <TextInput value={editing.author_role} onChange={(e) => setEditing({ ...editing, author_role: e.target.value })} placeholder="CEO" />
              </Field>
            </div>
            <Field label="Company">
              <TextInput value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
            </Field>
            <Field label="Quote">
              <TextArea required value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} />
            </Field>

            <Field label="Rating">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEditing({ ...editing, rating: n })}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className="p-1"
                  >
                    <Star className={`h-6 w-6 transition ${n <= editing.rating ? "text-primary fill-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Video URL (optional)">
                <TextInput
                  type="url"
                  value={editing.video_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, video_url: e.target.value })}
                  placeholder="https://youtube.com/…"
                />
              </Field>
              <Field label="Video thumbnail URL (optional)">
                <TextInput
                  type="url"
                  value={editing.video_thumbnail_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, video_thumbnail_url: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete testimonial?"
        description={confirmDelete ? `“${confirmDelete.author_name}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
