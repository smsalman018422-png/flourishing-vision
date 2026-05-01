import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, Lock, User as UserIcon } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  country: string | null;
  timezone: string | null;
};

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "United Arab Emirates",
  "Saudi Arabia",
  "India",
  "Pakistan",
  "Bangladesh",
  "Singapore",
  "Japan",
  "South Korea",
  "Brazil",
  "Mexico",
  "Argentina",
  "South Africa",
  "Nigeria",
  "Egypt",
  "Turkey",
  "Other",
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
];

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name required").max(120),
  company_name: z.string().trim().max(160).nullable(),
  phone: z.string().trim().max(40).nullable(),
  whatsapp_number: z.string().trim().max(40).nullable(),
  country: z.string().trim().max(80).nullable(),
  timezone: z.string().trim().max(80).nullable(),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password too long"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const Route = createFileRoute("/client/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pwd, setPwd] = useState({ password: "", confirm: "" });
  const [updatingPwd, setUpdatingPwd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const [{ data: u }, { data: p, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("client_profiles").select("*").eq("id", userId).maybeSingle(),
      ]);
      if (error) toast.error(error.message);
      setEmail(u?.user?.email ?? "");
      setProfile((p as Profile | null) ?? null);
      setLoading(false);
    })();
  }, [userId]);

  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onUploadAvatar = async (file: File) => {
    if (!userId || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("client-avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("client-avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("client_profiles")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (updErr) throw updErr;
      updateField("avatar_url", url);
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSaveProfile = async () => {
    if (!userId || !profile) return;
    const parsed = profileSchema.safeParse({
      full_name: profile.full_name,
      company_name: profile.company_name,
      phone: profile.phone,
      whatsapp_number: profile.whatsapp_number,
      country: profile.country,
      timezone: profile.timezone,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("client_profiles")
      .update(parsed.data)
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const onUpdatePassword = async () => {
    const parsed = passwordSchema.safeParse(pwd);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setUpdatingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setUpdatingPwd(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      setPwd({ password: "", confirm: "" });
    }
  };

  if (!ready || loading || !profile) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security.</p>
      </div>

      {/* PROFILE */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-border">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full grid place-items-center bg-background/70 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs font-medium"
                aria-label="Change photo"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex flex-col items-center gap-0.5">
                    <Camera className="h-4 w-4" />
                    Change
                  </span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs">JPG or PNG, max 5MB.</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <Input
                value={profile.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="Email">
              <Input value={email} readOnly disabled className="bg-muted/50" />
            </Field>
            <Field label="Company Name">
              <Input
                value={profile.company_name ?? ""}
                onChange={(e) => updateField("company_name", e.target.value || null)}
                maxLength={160}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={profile.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value || null)}
                maxLength={40}
                placeholder="+1 555 000 0000"
              />
            </Field>
            <Field label="WhatsApp Number">
              <Input
                type="tel"
                value={profile.whatsapp_number ?? ""}
                onChange={(e) => updateField("whatsapp_number", e.target.value || null)}
                maxLength={40}
                placeholder="+1 555 000 0000"
              />
            </Field>
            <Field label="Country">
              <Select
                value={profile.country ?? ""}
                onValueChange={(v) => updateField("country", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Timezone">
              <Select
                value={profile.timezone ?? ""}
                onValueChange={(v) => updateField("timezone", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex justify-end pt-2 border-t border-border/40">
            <Button onClick={() => void onSaveProfile()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECURITY */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Update your password. Use at least 8 characters.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New Password">
              <Input
                type="password"
                value={pwd.password}
                onChange={(e) => setPwd((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
                maxLength={72}
              />
            </Field>
            <Field label="Confirm Password">
              <Input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
                maxLength={72}
              />
            </Field>
          </div>
          <div className="flex justify-end pt-2 border-t border-border/40">
            <Button
              onClick={() => void onUpdatePassword()}
              disabled={updatingPwd || !pwd.password}
            >
              {updatingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
