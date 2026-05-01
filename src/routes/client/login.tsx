import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { toast } from "sonner";
import { z } from "zod";
import { Button, Field, TextInput } from "@/components/admin/ui";

type Tab = "login" | "signup";
const sb = supabase as any;

export const Route = createFileRoute("/client/login")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => ({
    tab: s.tab === "signup" ? "signup" : s.tab === "login" ? "login" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Client Portal — Let Us Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientAuthPage,
});

function ClientAuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/client/login" });
  const [activeTab, setActiveTab] = useState<Tab>(search.tab ?? "login");

  useEffect(() => {
    if (search.tab && search.tab !== activeTab) setActiveTab(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  // Auto-redirect already-logged-in users
  useEffect(() => {
    let cancelled = false;
    const route = async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid || cancelled) return;
      // Best-effort role check; if PostgREST is slow/down, default to client dashboard.
      let isAdmin = false;
      try {
        const rolesPromise = sb.from("user_roles").select("role").eq("user_id", uid);
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), 1500));
        const result = (await Promise.race([rolesPromise, timeout])) as { data: { role: string }[] | null };
        isAdmin = (result?.data ?? []).some((r) => r.role === "admin");
      } catch {
        // ignore
      }
      if (cancelled) return;
      if (isAdmin) navigate({ to: "/admin", replace: true });
      else navigate({ to: "/client/dashboard", replace: true });
    };
    void route();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8" aria-label="Let Us Grow — Home">
          <span className="font-display font-bold tracking-tight text-3xl leading-none whitespace-nowrap">
            <span className="text-foreground">Let Us </span>
            <span className="text-gradient">Grow</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* Tab switcher */}
          <div className="flex w-full rounded-lg overflow-hidden border border-border/60 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "login"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "signup"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {activeTab === "login" ? (
            <LoginForm />
          ) : (
            <SignupForm onSwitchToLogin={() => setActiveTab("login")} />
          )}
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

/* ---------------- Login Form ---------------- */
function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError || !authData.user || !authData.session) {
        const message = authError?.message ?? "Sign-in failed";
        if (message.includes("Invalid login credentials")) {
          setError("Wrong email or password. Please check and try again.");
        } else if (message.includes("Email not confirmed")) {
          setError("Please verify your email first. Check your inbox.");
        } else {
          setError(message);
        }
        setBusy(false);
        return;
      }

      // Try admin role check, but don't block login on transient API errors.
      let isAdmin = false;
      try {
        const rolesPromise = sb
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id);
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), 1500));
        const result = (await Promise.race([rolesPromise, timeout])) as { data: { role: string }[] | null };
        isAdmin = (result?.data ?? []).some((r) => r.role === "admin");
      } catch {
        // ignore — default to client dashboard
      }

      toast.success("Welcome back");
      if (isAdmin) {
        await navigate({ to: "/admin", replace: true });
      } else {
        await navigate({ to: "/client/dashboard", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    <>
      <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Sign in to access your dashboard.
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
          <div className="relative">
            <TextInput
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
    </>
  );
}

/* ---------------- Signup Form ---------------- */
const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const parsed = signupSchema.safeParse({ fullName, email: normalizedEmail, phone, companyName, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service");
      return;
    }

    setBusy(true);
    const createProfile = async (uid: string) => {
      try {
        await sb.from("client_profiles").upsert(
          {
            id: uid,
            email: parsed.data.email,
            full_name: parsed.data.fullName || "",
            phone: phone?.trim() || null,
            whatsapp_number: phone?.trim() || null,
            company_name: companyName?.trim() || null,
            is_active: true,
          },
          { onConflict: "id" },
        );
        await sb.from("client_notifications").insert({
          client_id: uid,
          title: "Welcome to Let Us Grow! 🎉",
          body: "Your account is ready. Explore your dashboard to get started.",
          type: "success",
        });
      } catch (e) {
        console.error("Profile insert error:", e);
      }
    };

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (authError) {
        const msg = authError.message || "";
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("User already")) {
          setError("This email is already registered. Please sign in instead.");
          onSwitchToLogin();
        } else if (msg.includes("signup_disabled")) {
          setError("Signup is currently disabled. Please contact support.");
        } else {
          setError(msg);
        }
        setBusy(false);
        return;
      }
      if (!authData?.user) {
        setError("Failed to create account. Please try again.");
        setBusy(false);
        return;
      }

      // Auto-confirmed: session present
      if (authData.session) {
        await createProfile(authData.user.id);
        toast.success("Account created! Welcome!");
        await navigate({ to: "/client/dashboard", replace: true });
        return;
      }

      // No session — try immediate sign-in (auto-confirm should be on)
      await new Promise((r) => setTimeout(r, 800));
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (!loginError && loginData?.session) {
        await createProfile(loginData.user.id);
        toast.success("Account created! Welcome!");
        await navigate({ to: "/client/dashboard", replace: true });
        return;
      }

      console.error("Auto-login after signup failed:", loginError);
      toast.success("Account created! Please check your email to confirm, then sign in.");
      onSwitchToLogin();
      setBusy(false);
    } catch (err) {
      console.error("Signup catch:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Join hundreds of brands scaling globally with Let Us Grow.
      </p>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <Field label="Full Name">
          <TextInput
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone / WhatsApp">
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              autoComplete="tel"
            />
          </Field>
          <Field label="Company Name">
            <TextInput
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              autoComplete="organization"
            />
          </Field>
        </div>

        <Field label="Password">
          <div className="relative">
            <TextInput
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password">
          <TextInput
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
        </Field>

        <label className="flex items-start gap-2 text-xs text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>
            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
            and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </span>
        </label>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>
    </>
  );
}
