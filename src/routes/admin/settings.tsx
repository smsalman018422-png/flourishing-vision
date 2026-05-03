import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, Card, Field, PageTitle, TextArea, TextInput } from "@/components/admin/ui";
import { adminData, adminWrite } from "@/lib/admin-data";
import { Loader2, Save, Trash2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { resetPixelConfig } from "@/lib/meta-pixel";

type RoleRow = { id: string; user_id: string; role: string; created_at: string };

const TABS = [
  { id: "contact", label: "Contact info" },
  { id: "social", label: "Social media" },
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
  { id: "calendly", label: "Calendly" },
  { id: "legal", label: "Legal pages" },
  { id: "paypal", label: "PayPal" },
  { id: "pixel", label: "Meta Pixel" },
  { id: "admins", label: "Admins" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SECTION_KEYS: Record<Exclude<TabId, "admins" | "pixel">, { key: string; label: string; placeholder?: string; multiline?: boolean }[]> = {
  contact: [
    { key: "contact_email", label: "Contact email", placeholder: "hello@letusgrow.com" },
    { key: "whatsapp_number", label: "WhatsApp number", placeholder: "+1 555 123 4567" },
    { key: "contact_phone", label: "Phone", placeholder: "+1 555 123 4567" },
    { key: "office_address", label: "Office address", multiline: true },
  ],
  social: [
    { key: "instagram_url", label: "Instagram URL" },
    { key: "linkedin_url", label: "LinkedIn URL" },
    { key: "twitter_url", label: "Twitter / X URL" },
    { key: "facebook_url", label: "Facebook URL" },
    { key: "youtube_url", label: "YouTube URL" },
    { key: "tiktok_url", label: "TikTok URL" },
  ],
  hero: [
    { key: "hero_headline", label: "Headline", placeholder: "Compounding growth, on autopilot." },
    { key: "hero_subtext", label: "Subtext", multiline: true },
    { key: "hero_cta_label", label: "Primary CTA label", placeholder: "Book a call" },
  ],
  about: [{ key: "about_long", label: "About content", multiline: true }],
  calendly: [{ key: "calendly_url", label: "Calendly URL", placeholder: "https://calendly.com/…" }],
  legal: [
    { key: "legal_privacy", label: "Privacy Policy (/privacy)", multiline: true, placeholder: "Write your full Privacy Policy here. Plain text or simple paragraphs." },
    { key: "legal_terms", label: "Terms of Service (/terms)", multiline: true, placeholder: "Write your full Terms of Service here." },
    { key: "legal_cookies", label: "Cookie Policy (/cookies)", multiline: true, placeholder: "Write your full Cookie Policy here." },
  ],
  paypal: [
    { key: "paypal_client_id", label: "PayPal Client ID", placeholder: "Public Client ID from PayPal Developer Dashboard" },
    { key: "paypal_mode", label: "PayPal Mode (sandbox or live)", placeholder: "sandbox" },
    { key: "paypal_business_email", label: "PayPal Business Email", placeholder: "payments@yourbusiness.com" },
  ],
};

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <SettingsAdmin />
    </AdminShell>
  ),
});

function SettingsAdmin() {
  const [tab, setTab] = useState<TabId>("contact");

  return (
    <>
      <PageTitle title="Settings" />

      <div className="-mx-1 mb-5 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max border-b border-border/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {tab === "admins" ? (
        <AdminsSection />
      ) : tab === "pixel" ? (
        <PixelSection />
      ) : (
        <SettingsSection key={tab} fields={SECTION_KEYS[tab]} />
      )}
    </>
  );
}

function SettingsSection({
  fields,
}: {
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminData<{ key: string; value: { v?: string } | null }>({
      table: "site_settings",
      select: "*",
      filters: [{ op: "in", column: "key", value: fields.map((f) => f.key) }],
    }).then(({ data, error }) => {
      const map: Record<string, string> = {};
      fields.forEach((f) => (map[f.key] = ""));
      if (error) console.error("Admin data error (site_settings):", error);
      (data ?? []).forEach((r) => {
        const v = r.value;
        map[r.key] = v?.v ?? "";
      });
      setValues(map);
      setInitial(map);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [fields]);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const saveSection = async () => {
    setSaving(true);
    const changed = fields.filter((f) => values[f.key] !== initial[f.key]);
    if (changed.length === 0) {
      setSaving(false);
      return;
    }
    const rows = changed.map((f) => ({ key: f.key, value: { v: values[f.key] ?? "" } }));
    const { error } = await adminWrite({ table: "site_settings", op: "upsert", values: rows, onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error);
    setInitial(values);
    toast.success("Saved");
  };

  if (loading)
    return (
      <Card>
        <div className="py-8 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </Card>
    );

  return (
    <Card>
      <div className="space-y-4">
        {fields.map((f) =>
          f.multiline ? (
            <Field key={f.key} label={f.label}>
              <TextArea
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </Field>
          ) : (
            <Field key={f.key} label={f.label}>
              <TextInput
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </Field>
          ),
        )}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border/60">
        <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <Button onClick={saveSection} disabled={!dirty || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save section</>}
        </Button>
      </div>
    </Card>
  );
}

function AdminsSection() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<RoleRow[]>([]);
  const [newAdminId, setNewAdminId] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminData<RoleRow>({
      table: "user_roles",
      select: "*",
      filters: [{ op: "eq", column: "role", value: "admin" }],
    }).then(({ data, error }) => {
      if (error) console.error("Admin data error (user_roles):", error);
      setAdmins((data ?? []) as RoleRow[]);
      setLoading(false);
    });
  };
  useEffect(() => {
    load();
  }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim()) return;
    setGrantBusy(true);
    const { error } = await adminWrite({ table: "user_roles", op: "insert", values: { user_id: newAdminId.trim(), role: "admin" } });
    setGrantBusy(false);
    if (error) return toast.error(error);
    toast.success("Admin granted");
    setNewAdminId("");
    load();
  };

  const revoke = async (id: string, userId: string) => {
    if (userId === user?.id) return toast.error("You can't revoke your own admin access.");
    if (!confirm("Revoke admin from this user?")) return;
    const { error } = await adminWrite({ table: "user_roles", op: "delete", match: [{ column: "id", value: id }] });
    if (error) return toast.error(error);
    toast.success("Revoked");
    load();
  };

  return (
    <Card>
      <h2 className="font-display font-semibold">Admins</h2>
      <p className="text-xs text-muted-foreground mt-1">
        New users can sign up at <code className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground">/admin/login</code>;
        copy their user ID from Backend → Users to grant access.
      </p>

      <form onSubmit={grant} className="mt-5 flex flex-col sm:flex-row gap-2">
        <TextInput placeholder="Paste user ID (UUID)" value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)} />
        <Button type="submit" disabled={grantBusy}>
          {grantBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Grant admin</>}
        </Button>
      </form>

      {loading ? (
        <div className="py-6 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border/60 border border-border/60 rounded-xl">
          {admins.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No admins yet.</li>
          ) : (
            admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-mono truncate">{a.user_id}</div>
                  <div className="text-xs text-muted-foreground">
                    added {new Date(a.created_at).toLocaleDateString()}
                    {a.user_id === user?.id ? " · you" : ""}
                  </div>
                </div>
                <Button variant="danger" onClick={() => revoke(a.id, a.user_id)} aria-label="Revoke">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      )}
    </Card>
  );
}

type PixelState = {
  pixel_id: string;
  pixel_enabled: boolean;
  pixel_test_mode: boolean;
  pixel_test_code: string;
  pixel_test_activated_at: string;
};

function PixelSection() {
  const [s, setS] = useState<PixelState>({
    pixel_id: "",
    pixel_enabled: false,
    pixel_test_mode: false,
    pixel_test_code: "",
    pixel_test_activated_at: "",
  });
  const [initial, setInitial] = useState<PixelState>(s);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = () => {
    setLoading(true);
    adminData<{ key: string; value: any }>({
      table: "site_settings",
      select: "*",
      filters: [
        {
          op: "in",
          column: "key",
          value: [
            "pixel_id",
            "pixel_enabled",
            "pixel_test_mode",
            "pixel_test_code",
            "pixel_test_activated_at",
          ],
        },
      ],
    }).then(({ data }) => {
      const next: PixelState = {
        pixel_id: "",
        pixel_enabled: false,
        pixel_test_mode: false,
        pixel_test_code: "",
        pixel_test_activated_at: "",
      };
      (data ?? []).forEach((r) => {
        const v = r.value?.v ?? r.value?.value ?? r.value;
        if (r.key === "pixel_enabled" || r.key === "pixel_test_mode") {
          (next as any)[r.key] = v === true || v === "true";
        } else {
          (next as any)[r.key] = v ?? "";
        }
      });
      // Auto-expire test mode
      if (next.pixel_test_mode && next.pixel_test_activated_at) {
        const t = new Date(next.pixel_test_activated_at).getTime();
        if (!isNaN(t) && (Date.now() - t) / 36e5 >= 24) {
          next.pixel_test_mode = false;
        }
      }
      setS(next);
      setInitial(next);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const save = async (overrides?: Partial<PixelState>) => {
    setSaving(true);
    const merged = { ...s, ...overrides };
    const rows = Object.entries(merged).map(([k, v]) => ({
      key: k,
      value: { v },
    }));
    const { error } = await adminWrite({
      table: "site_settings",
      op: "upsert",
      values: rows,
      onConflict: "key",
    });
    setSaving(false);
    if (error) return toast.error(error);
    setS(merged);
    setInitial(merged);
    resetPixelConfig();
    toast.success("Pixel settings saved");
  };

  const activateTest = () => {
    const next = {
      ...s,
      pixel_test_mode: true,
      pixel_test_activated_at: new Date().toISOString(),
    };
    setS(next);
    void save(next);
  };

  const status = useMemo(() => {
    if (!s.pixel_enabled || !s.pixel_id)
      return { color: "bg-red-500", label: "Inactive" };
    if (s.pixel_test_mode) return { color: "bg-yellow-500", label: "Test Mode" };
    return { color: "bg-green-500", label: "Active" };
  }, [s]);

  const remaining = useMemo(() => {
    if (!s.pixel_test_mode || !s.pixel_test_activated_at) return null;
    const t = new Date(s.pixel_test_activated_at).getTime();
    if (isNaN(t)) return null;
    const ms = t + 24 * 36e5 - now;
    if (ms <= 0) return "expired";
    const h = Math.floor(ms / 36e5);
    const m = Math.floor((ms % 36e5) / 60000);
    return `${h}h ${m}m`;
  }, [s.pixel_test_mode, s.pixel_test_activated_at, now]);

  if (loading) {
    return (
      <Card>
        <div className="py-8 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold">Meta Pixel / Facebook Ads</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tracking pixel for Meta Ads optimisation. Loads only when enabled.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-muted/40">
          <span className={`h-2 w-2 rounded-full ${status.color}`} />
          {status.label}
          {remaining && remaining !== "expired" && s.pixel_test_mode
            ? ` · ${remaining} left`
            : ""}
        </span>
      </div>

      <div className="space-y-4">
        <Field label="Meta Pixel ID">
          <TextInput
            value={s.pixel_id}
            placeholder="e.g. 123456789012345"
            onChange={(e) => setS({ ...s, pixel_id: e.target.value })}
          />
        </Field>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
          <div>
            <div className="text-sm font-medium">Pixel enabled</div>
            <div className="text-xs text-muted-foreground">
              When off, the pixel script never loads.
            </div>
          </div>
          <input
            type="checkbox"
            checked={s.pixel_enabled}
            onChange={(e) => setS({ ...s, pixel_enabled: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
          <div>
            <div className="text-sm font-medium">Test mode</div>
            <div className="text-xs text-muted-foreground">
              Test events valid for 24 hours from activation.
            </div>
          </div>
          <input
            type="checkbox"
            checked={s.pixel_test_mode}
            onChange={(e) => setS({ ...s, pixel_test_mode: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>

        {s.pixel_test_mode && (
          <Field label="Test event code">
            <TextInput
              value={s.pixel_test_code}
              placeholder="TEST12345"
              onChange={(e) => setS({ ...s, pixel_test_code: e.target.value })}
            />
          </Field>
        )}

        {remaining && (
          <p className="text-xs text-muted-foreground">
            {remaining === "expired"
              ? "Test mode has expired — re-activate to continue testing."
              : `Test mode expires in: ${remaining}`}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={activateTest} disabled={saving}>
            Activate test mode
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              window.open(
                "https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc",
                "_blank",
                "noreferrer",
              )
            }
          >
            <ExternalLink className="h-4 w-4" /> Verify pixel
          </Button>
        </div>
        <Button onClick={() => save()} disabled={!dirty || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <><Save className="h-4 w-4" /> Save pixel settings</>
          )}
        </Button>
      </div>
    </Card>
  );
}
