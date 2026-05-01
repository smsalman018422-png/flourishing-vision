import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, TextInput } from "@/components/admin/ui";

export const Route = createFileRoute("/client/login")({
  head: () => ({
    meta: [
      { title: "Client Portal — LetUsGrow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientLoginPage,
});

function ClientLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("id", uid)
        .maybeSingle();
      if (profile) navigate({ to: "/client/dashboard" });
    })();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !authData.user) {
        setError(authError?.message ?? "Sign-in failed");
        return;
      }
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (!profile) {
        setError("No client account found for this email. Please contact us.");
        await supabase.auth.signOut();
        return;
      }
      toast.success("Welcome back");
      navigate({ to: "/client/dashboard" });
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-display font-semibold text-lg">
            LetUs<span className="text-gradient">Grow</span>
          </span>
        </Link>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">
            Client Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Access your dashboard, reports, and project updates.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
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
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForgot}
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
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
