import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/States";
import { adminData, adminWrite } from "@/lib/admin-data";
import { Edit2, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  author_role: string | null;
  author_avatar_url: string | null;
  category: string | null;
  read_time_minutes: number | null;
  is_featured: boolean;
  published: boolean;
  published_at: string | null;
};

const CATEGORIES = ["Growth", "Paid Ads", "SEO", "Branding", "Design", "Social Media", "Strategy", "Case Study"];

const empty = (): Post => ({
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: null,
  author_name: "",
  author_role: "",
  author_avatar_url: null,
  category: "Growth",
  read_time_minutes: 5,
  is_featured: false,
  published: false,
  published_at: null,
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <BlogAdmin />
    </AdminShell>
  ),
});

function BlogAdmin() {
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await adminData<Post>({
      table: "blog_posts",
      select: "*",
      orders: [{ column: "published_at", ascending: false, nullsFirst: false }, { column: "created_at", ascending: false }],
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
  }, []);

  const persist = async (asPublished?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setBusy(true);
    const willPublish = asPublished ?? editing.published;
    const payload = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      excerpt: editing.excerpt?.trim() || null,
      content: editing.content || null,
      cover_image_url: editing.cover_image_url,
      author_name: editing.author_name?.trim() || null,
      author_role: editing.author_role?.trim() || null,
      author_avatar_url: editing.author_avatar_url,
      category: editing.category,
      read_time_minutes: editing.read_time_minutes,
      is_featured: editing.is_featured,
      published: willPublish,
      published_at: willPublish ? editing.published_at ?? new Date().toISOString() : editing.published_at,
    };
    const isNew = !editing.id;
    const { error } = isNew
      ? await adminWrite({ table: "blog_posts", op: "insert", values: payload })
      : await adminWrite({ table: "blog_posts", op: "update", values: payload, match: [{ column: "id", value: editing.id }] });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(willPublish ? "Published" : "Saved as draft");
    setEditing(null);
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setRows((r) => r.filter((x) => x.id !== id));
    setConfirmDelete(null);
    const { error } = await adminWrite({ table: "blog_posts", op: "delete", match: [{ column: "id", value: id }] });
    if (error) {
      toast.error(error);
      load();
    } else toast.success("Removed");
  };

  return (
    <>
      <PageTitle
        title="Blog posts"
        action={
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4" /> New post
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title="No posts yet." actionLabel="Write your first post" onAction={() => setEditing(empty())} />
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition">
                <div className="h-14 w-20 rounded-lg overflow-hidden bg-muted/30 shrink-0 grid place-items-center">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No cover</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium truncate">{p.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.published ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {p.published ? "Published" : "Draft"}
                    </span>
                    {p.is_featured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent-foreground">Featured</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.category ?? "Uncategorized"}
                    {p.author_name ? ` · ${p.author_name}` : ""}
                    {p.published_at ? ` · ${new Date(p.published_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.published && (
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      aria-label="View"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
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
        title={editing?.id ? "Edit post" : "New post"}
        size="xl"
        footer={
          editing ? (
            <Button variant="ghost" type="button" onClick={() => persist(false)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as draft"}
            </Button>
          ) : null
        }
        onSubmit={() => persist(true)}
        submitLabel={editing?.published ? "Update" : "Publish"}
        busy={busy}
      >
        {editing && (
          <div className="space-y-5">
            <Field label="Cover image">
              <ImageUpload
                value={editing.cover_image_url}
                onChange={(url) => setEditing({ ...editing, cover_image_url: url })}
                bucket="blog-covers"
                aspectClass="aspect-video"
                label="Cover"
              />
            </Field>
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
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Slug (URL)">
                <TextInput
                  required
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                />
              </Field>
              <Field label="Category">
                <Select value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Excerpt">
              <TextArea
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                placeholder="Short teaser shown on cards and meta description"
              />
            </Field>
            <Field label="Content">
              <RichTextEditor
                value={editing.content ?? ""}
                onChange={(html) => setEditing({ ...editing, content: html })}
                placeholder="Write your post…"
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Author name">
                <TextInput
                  value={editing.author_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                />
              </Field>
              <Field label="Author role">
                <TextInput
                  value={editing.author_role ?? ""}
                  onChange={(e) => setEditing({ ...editing, author_role: e.target.value })}
                />
              </Field>
              <Field label="Read time (min)">
                <TextInput
                  type="number"
                  value={editing.read_time_minutes ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      read_time_minutes: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Author avatar">
              <ImageUpload
                value={editing.author_avatar_url}
                onChange={(url) => setEditing({ ...editing, author_avatar_url: url })}
                bucket="blog-covers"
                folder="authors"
                aspectClass="aspect-square max-w-[120px]"
                label="Avatar"
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={editing.is_featured}
                onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
              />
              Featured post
            </label>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete post?"
        description={confirmDelete ? `“${confirmDelete.title}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
