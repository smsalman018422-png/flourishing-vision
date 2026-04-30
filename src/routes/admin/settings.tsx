import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, TextInput } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

type RoleRow = { id: string; user_id: string; role: string; created_at: string };

const SETTING_KEYS = [
  { key: "contact_email", label: "Contact email", placeholder: "hello@letusgrow.com" },
  { key: "whatsapp_number", label: "WhatsApp number", placeholder: "+1 555 123 4567" },
  { key: "calendly_url", label: "Calendly URL", placeholder: "https://calendly.com/..." },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "linkedin_url", label: "LinkedIn URL" },
];

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <SettingsPage />
    </AdminShell>
  ),
});

function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [admins, setAdmins] = useState<RoleRow[]>([]);
  const [newAdminId, setNewAdminId] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  const loadSettings = () => {
    supabase
      .from("site_settings")
      .select("*")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((r) => {
          const v = r.value as { v?: string } | null;
          map[r.key] = v?.v ?? "";
        });
        setSettings(map);
        setLoading(false);
      });
  };
  const loadAdmins = () => {
    supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin")
      .then(({ data }) => setAdmins((data ?? []) as RoleRow[]));
  };
  useEffect(() => {
    loadSettings();
    loadAdmins();
  }, []);

  const saveSetting = async (key: string) => {
    setSavingKey(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: { v: settings[key] ?? "" } }, { onConflict: "key" });
    setSavingKey(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const grantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim()) return;
    setGrantBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: newAdminId.trim(), role: "admin" });
    setGrantBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Admin granted");
    setNewAdminId("");
    loadAdmins();
  };

  const revoke = async (id: string, userId: string) => {
    if (userId === user?.id) return toast.error("You can't revoke your own admin access.");
    if (!confirm("Revoke admin from this user?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    loadAdmins();
  };

  return (
    <>
      <PageTitle title="Settings" />

      <Card>
        <h2 className="font-display font-semibold">Site settings</h2>
        <p className="text-xs text-muted-foreground mt-1">Public values used across the site.</p>

        {loading ? (
          <div className="py-6 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-5 space-y-4">
            {SETTING_KEYS.map((s) => (
              <Field key={s.key} label={s.label}>
                <div className="flex gap-2">
                  <TextInput
                    placeholder={s.placeholder}
                    value={settings[s.key] ?? ""}
                    onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })}
                  />
                  <Button onClick={() => saveSetting(s.key)} disabled={savingKey === s.key}>
                    {savingKey === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </Field>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="font-display font-semibold">Admins</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Grant the admin role by user ID. New users can sign up at <code className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground">/admin/login</code>; copy their user ID from Backend → Users.
        </p>

        <form onSubmit={grantAdmin} className="mt-5 flex flex-col sm:flex-row gap-2">
          <TextInput
            placeholder="Paste user ID (UUID)"
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
          />
          <Button type="submit" disabled={grantBusy}>
            {grantBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Grant admin</>}
          </Button>
        </form>

        <ul className="mt-5 divide-y divide-border/60 border border-border/60 rounded-xl">
          {admins.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No admins yet.</li>
          ) : (
            admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-mono truncate">{a.user_id}</div>
                  <div className="text-xs text-muted-foreground">added {new Date(a.created_at).toLocaleDateString()}{a.user_id === user?.id ? " · you" : ""}</div>
                </div>
                <Button variant="danger" onClick={() => revoke(a.id, a.user_id)} aria-label="Revoke">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </>
  );
}
