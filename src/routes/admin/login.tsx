import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { Button, Field, TextInput } from "@/components/admin/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin login — Let Us Grow" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AuthProvider>
      <AdminLogin />
    </AuthProvider>
  ),
});

function AdminLogin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !authData.user) {
        toast.error(authError?.message ?? "Sign-in failed");
        return;
      }

      const adminRes = await fetch("/api/admin-check", {
        method: "POST",
        headers: { Authorization: `Bearer ${authData.session?.access_token ?? ""}` },
      });
      const adminCheck = (await adminRes.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!adminRes.ok || !adminCheck?.ok) {
        toast.error(adminCheck?.error ?? "You are not authorized");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back");
      navigate({ to: "/admin" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8"
          aria-label="Let Us Grow — Home"
        >
          <span className="font-display font-bold tracking-tight text-3xl leading-none whitespace-nowrap">
            <span className="text-foreground">Let Us </span>
            <span className="text-gradient">Grow</span>
          </span>
        </Link>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Authorized staff only.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@letusgrow.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  toast.error("Enter your email first");
                  return;
                }
                const { supabase } = await import("@/integrations/supabase/client");
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error(error.message);
                else toast.success("Check your email for a reset link.");
              }}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
        <Link
          to="/"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
