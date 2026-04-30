import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "@/components/admin/ui";
import { Drawer } from "@/components/admin/Drawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SortableList } from "@/components/admin/SortableList";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/States";
import { adminData, adminWrite } from "@/lib/admin-data";
import { Edit2, Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  name: string;
  role: string;
  category: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  is_founder: boolean;
  is_visible: boolean;
  sort_order: number;
};

const CATEGORIES = ["Leadership", "Strategy", "Creative", "Designers", "Writers", "Social Media", "Paid Ads", "Account Mgmt", "Analytics", "QC", "Engineering", "Operations"];

const empty = (): Member => ({
  id: "",
  name: "",
  role: "",
  category: "Strategy",
  bio: "",
  photo_url: null,
  linkedin_url: "",
  is_founder: false,
  is_visible: true,
  sort_order: 0,
});

export const Route = createFileRoute("/admin/team")({
  head: () => ({ meta: [{ title: "Team — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <TeamAdmin />
    </AdminShell>
  ),
});

function TeamAdmin() {
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await adminData<Member>({
      table: "team_members",
      select: "*",
      orders: [{ column: "sort_order", ascending: true }, { column: "created_at", ascending: true }],
    });
    if (error) {
      console.error("Admin data error (team_members):", error);
      setLoadError(error);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as Member[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      role: editing.role.trim(),
      category: editing.category,
      bio: editing.bio?.trim() || null,
      photo_url: editing.photo_url,
      linkedin_url: editing.linkedin_url?.trim() || null,
      is_founder: editing.is_founder,
      is_visible: editing.is_visible,
    };
    const isNew = !editing.id;
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    if (isNew) {
      setRows((r) => [...r, { ...editing, id: tempId, sort_order: r.length }]);
    } else {
      setRows((r) => r.map((m) => (m.id === editing.id ? { ...m, ...payload } : m)));
    }
    const { error } = isNew
      ? await adminWrite({ table: "team_members", op: "insert", values: { ...payload, sort_order: rows.length } })
      : await adminWrite({ table: "team_members", op: "update", values: payload, match: [{ column: "id", value: editing.id }] });
    setBusy(false);
    if (error) {
      toast.error(error);
      load();
      return;
    }
    toast.success(isNew ? "Team member added" : "Saved");
    setEditing(null);
    load();
  };

  const toggleVisibility = async (m: Member) => {
    setRows((r) => r.map((x) => (x.id === m.id ? { ...x, is_visible: !x.is_visible } : x)));
    const { error } = await adminWrite({ table: "team_members", op: "update", values: { is_visible: !m.is_visible }, match: [{ column: "id", value: m.id }] });
    if (error) {
      toast.error(error);
      setRows((r) => r.map((x) => (x.id === m.id ? { ...x, is_visible: m.is_visible } : x)));
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setRows((r) => r.filter((x) => x.id !== id));
    setConfirmDelete(null);
    const { error } = await adminWrite({ table: "team_members", op: "delete", match: [{ column: "id", value: id }] });
    if (error) {
      toast.error(error);
      load();
    } else toast.success("Removed");
  };

  const onReorder = async (next: Member[]) => {
    setRows(next);
    const updates = next.map((m, i) =>
      adminWrite({ table: "team_members", op: "update", values: { sort_order: i }, match: [{ column: "id", value: m.id }] }),
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Some rows failed to reorder");
  };

  const founders = useMemo(() => rows.filter((r) => r.is_founder).length, [rows]);

  return (
    <>
      <PageTitle
        title="Team members"
        action={
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4" /> Add team member
          </Button>
        }
      />

      <div className="text-xs text-muted-foreground mb-3">
        {rows.length} total · {founders} founder{founders === 1 ? "" : "s"} · drag handle to reorder
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title="No team members yet." actionLabel="Add your first member" onAction={() => setEditing(empty())} />
        ) : (
          <SortableList
            items={rows}
            onReorder={onReorder}
            renderItem={(m) => (
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-muted/30 shrink-0 grid place-items-center">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    {m.is_founder && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        <Star className="h-3 w-3" /> Founder
                      </span>
                    )}
                    {!m.is_visible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {m.role} · {m.category}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVisibility(m)}
                    aria-label={m.is_visible ? "Hide" : "Show"}
                    title={m.is_visible ? "Hide" : "Show"}
                    className="grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    {m.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <Button variant="ghost" onClick={() => setEditing(m)} aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(m)} aria-label="Delete">
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
        title={editing?.id ? "Edit team member" : "Add team member"}
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
                bucket="team-photos"
                aspectClass="aspect-square max-w-[200px]"
                label="Photo"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <TextInput
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ada Lovelace"
                  required
                />
              </Field>
              <Field label="Role">
                <TextInput
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  placeholder="Head of Growth"
                  required
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Category">
                <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="LinkedIn URL">
                <TextInput
                  type="url"
                  value={editing.linkedin_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/…"
                />
              </Field>
            </div>
            <Field label="Bio">
              <TextArea
                value={editing.bio ?? ""}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                placeholder="Short bio (1–3 sentences)"
              />
            </Field>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={editing.is_founder}
                  onChange={(e) => setEditing({ ...editing, is_founder: e.target.checked })}
                />
                Founder
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
        title="Delete team member?"
        description={confirmDelete ? `“${confirmDelete.name}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}
