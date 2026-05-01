import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Field, TextInput } from "@/components/admin/ui";

export const Route = createFileRoute("/client/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — LetUsGrow" },
      { name: "description", content: "Sign up for the LetUsGrow client portal — track projects, reports, and growth." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientSignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function ClientSignupPage() {
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
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        navigate({ to: "/client/dashboard" });
      }
    })();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = schema.safeParse({ fullName, email, phone, companyName, password });
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
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/client/login`,
          data: { full_name: parsed.data.fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }
      if (!authData.user) {
        setError("Signup failed. Please try again.");
        return;
      }

      // If session exists (auto-confirm on), insert profile + welcome notif now
      if (authData.session) {
        await supabase.from("client_profiles").insert({
          id: authData.user.id,
          email: parsed.data.email,
          full_name: parsed.data.fullName,
          phone: phone || null,
          whatsapp_number: phone || null,
          company_name: companyName || null,
        });
        await supabase.from("client_notifications").insert({
          client_id: authData.user.id,
          title: "Welcome to LetUsGrow! 🎉",
          body: "Your account is ready. Explore your dashboard to get started.",
          type: "success",
        });
        toast.success("Account created!");
        navigate({ to: "/client/dashboard" });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-display font-semibold text-lg">
            LetUs<span className="text-gradient">Grow</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 grid place-items-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-semibold">Check your email!</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
                After confirming, you can sign in to your dashboard.
              </p>
              <Link
                to="/client/login"
                className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-glow"
              >
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-display font-semibold text-center">
                Create Your Account
              </h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Join hundreds of brands scaling globally with LetUsGrow.
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

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/client/login" className="text-primary hover:underline font-medium">
                  Sign In →
                </Link>
              </p>
            </>
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
