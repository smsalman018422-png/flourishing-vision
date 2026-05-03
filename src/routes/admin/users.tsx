import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, Select, TextInput } from "@/components/admin/ui";
import { ROLE_BADGE, ROLE_LABEL, highestRole, type StaffRole } from "@/lib/admin-roles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type StaffUser = {
  user_id: string;
  email: string | null;
  last_sign_in_at: string | null;
  roles: StaffRole[];
};

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin Users" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell requirePermission="admin-users">
      <AdminUsers />
    </AdminShell>
  ),
});

async function authedFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? "";
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function AdminUsers() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "admin" as "admin" | "manager" | "editor" });

  const refresh = async () => {
    setLoading(true);
    const res = await authedFetch("/api/admin-users");
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Failed to load admin users");
      setUsers([]);
    } else {
      setUsers(body.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await authedFetch("/api/admin-users", { method: "POST", body: JSON.stringify(form) });
    const body = await res.json().catch(() => null);
    setCreating(false);
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Failed to create user");
      return;
    }
    toast.success("Admin user created");
    setShowForm(false);
    setForm({ full_name: "", email: "", password: "", role: "admin" });
    void refresh();
  };

  const onChangeRole = async (user_id: string, role: StaffRole) => {
    const res = await authedFetch("/api/admin-users", { method: "PATCH", body: JSON.stringify({ user_id, role }) });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Failed to update role");
      return;
    }
    toast.success("Role updated");
    void refresh();
  };

  const onRemove = async (user_id: string) => {
    if (!window.confirm("Remove all staff access for this user?")) return;
    const res = await authedFetch("/api/admin-users", { method: "DELETE", body: JSON.stringify({ user_id }) });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Failed to remove access");
      return;
    }
    toast.success("Staff access removed");
    void refresh();
  };

  return (
    <>
      <PageTitle
        title="Admin Users"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add admin user
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <TextInput type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password (min 8 chars)">
              <TextInput type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="editor">Editor</option>
              </Select>
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create admin user"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="py-12 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No staff users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Last sign-in</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const top = highestRole(u.roles) ?? "editor";
                  return (
                    <tr key={u.user_id} className="border-t border-border/40">
                      <td className="py-3 pr-4">{u.email ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${ROLE_BADGE[top]}`}>
                          {ROLE_LABEL[top]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}
                      </td>
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <Select
                          value={top}
                          onChange={(e) => onChangeRole(u.user_id, e.target.value as StaffRole)}
                          className="max-w-[160px]"
                        >
                          <option value="super_admin">Super admin</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="editor">Editor</option>
                        </Select>
                        <Button variant="danger" onClick={() => onRemove(u.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
