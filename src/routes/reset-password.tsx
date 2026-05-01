import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Field, TextInput } from "@/components/admin/ui";
import { Loader2 } from "lucide-react";
import logoSrc from "@/assets/logo.png";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — Let Us Grow" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery token from the URL hash automatically and
    // emits a PASSWORD_RECOVERY event. Wait for a session to be present.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Signing you in…");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logoSrc} alt="Let Us Grow" className="h-10 w-auto object-contain" />
        </Link>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {ready ? "Choose a strong password to finish resetting." : "Verifying your reset link…"}
          </p>
          {ready && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="New password">
                <TextInput
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
          <Link to="/admin/login" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
