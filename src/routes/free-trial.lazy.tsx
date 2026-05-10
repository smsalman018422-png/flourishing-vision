import { createLazyFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  Palette,
  ShieldCheck,
  Check,
  ArrowRight,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  Phone,
  Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createLazyFileRoute("/free-trial")({
  component: FreeTrialPage,
});

const sb = supabase as any;

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. 100% free for 7 days. No credit card required. No hidden fees.",
  },
  {
    q: "What happens after 7 days?",
    a: "You can choose to continue with a paid plan (starting $297/mo) or walk away. No pressure, no contracts.",
  },
  {
    q: "What do I need to provide?",
    a: "Just your brand details, social handles, and a 30-min strategy call.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. You're in full control.",
  },
  {
    q: "Will my account be charged automatically?",
    a: "No. We never auto-charge. You explicitly choose to upgrade after the trial.",
  },
  {
    q: "What kind of brands do you work with?",
    a: "All sizes — startups, ecommerce, personal brands, B2B services.",
  },
];

const FEATURES = [
  "Custom Growth Strategy & Brand Audit",
  "7-Day Content Calendar",
  "5+ Professionally Designed Posts",
  "Daily Community Engagement",
  "Performance Analytics Dashboard",
  "1-on-1 Strategy Call with Expert",
  "Competitor Analysis Report",
  "Hashtag & Keyword Research",
];

type Testimonial = {
  id: string;
  author_name: string;
  author_role: string;
  company: string;
  quote: string;
  rating: number;
  photo_url: string | null;
};

function FreeTrialPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id,author_name,author_role,company,quote,rating,photo_url")
        .order("sort_order", { ascending: true })
        .limit(3);
      if (mounted && data) setTestimonials(data as Testimonial[]);
    })();
    // Meta Pixel page view
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", "FreeTrialLandingView");
    }
    return () => {
      mounted = false;
    };
  }, []);

  const openSignup = () => {
    setSignupOpen(true);
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", "FreeTrialCtaClick");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f0d] via-[#0d1612] to-[#0f1a14]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,222,128,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6">
              🎁 Limited Time Offer
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight">
              Scale Your Brand Risk-Free for{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  7 Days
                </span>
                <span className="absolute -inset-1 bg-emerald-400/20 blur-xl -z-10" />
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              Experience premium social media growth, content strategy, and performance marketing
              completely free for 7 days. Zero risk. Real results.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" /> No Credit Card
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" /> Cancel Anytime
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" /> 100+ Brands Scaled
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={openSignup}
                className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] font-bold text-base shadow-[0_0_40px_rgba(74,222,128,0.4)] hover:shadow-[0_0_60px_rgba(74,222,128,0.6)] hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                Start 7-Day Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl border-2 border-emerald-400/40 text-emerald-300 font-semibold hover:bg-emerald-500/10 hover:border-emerald-400/70 transition-all"
              >
                <Calendar className="h-5 w-5" />
                Book Free Strategy Call
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-white/60">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>Join 500+ brands growing with us</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl">
              Why Brands Love Our 7-Day Trial
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Real Growth Strategy",
                body:
                  "We analyze your brand deeply and create a tailored growth strategy before posting a single piece of content. Data-driven, proven results.",
              },
              {
                icon: Palette,
                title: "Premium Creative Content",
                body:
                  "Receive agency-quality creatives, captions, and content systems built specifically for engagement and brand growth.",
              },
              {
                icon: ShieldCheck,
                title: "Zero Risk",
                body:
                  "Try our full service for 7 days completely free. No contracts. No credit card. No pressure. If you don't see value, you walk away — no questions asked.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur p-8 hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(74,222,128,0.15)] transition-all"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-400/10 border border-emerald-400/30 text-emerald-300 mb-4">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-24 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl">
              Everything Premium Brands Use —{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Free for 7 Days
              </span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10"
              >
                <div className="mt-0.5 h-6 w-6 rounded-full bg-emerald-500/20 grid place-items-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <span className="text-white/85">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl">
              How It Works
            </h2>
          </div>
          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            {[
              {
                n: "01",
                title: "Sign Up in 30 Seconds",
                body: "Just your name, contact, and brand details",
                icon: Rocket,
              },
              {
                n: "02",
                title: "Strategy Call within 24 Hours",
                body: "We deeply understand your brand",
                icon: Phone,
              },
              {
                n: "03",
                title: "We Start Working — Day 1",
                body: "Content, growth, results begin immediately",
                icon: Sparkles,
              },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center shadow-[0_0_40px_rgba(74,222,128,0.3)]">
                  <s.icon className="h-10 w-10 text-[#0a0f0d]" />
                </div>
                <div className="mt-6 text-emerald-400 text-sm font-mono font-bold">{s.n}</div>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/65">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 mb-16">
            {[
              { v: "500+", l: "Brands" },
              { v: "$10M+", l: "Revenue Generated" },
              { v: "4.9/5", l: "Rating" },
            ].map((s) => (
              <div
                key={s.l}
                className="text-center rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="font-display text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {s.v}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-white/60">{s.l}</div>
              </div>
            ))}
          </div>

          {testimonials.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">"{t.quote}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    {t.photo_url ? (
                      <img
                        src={t.photo_url}
                        alt={t.author_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 grid place-items-center text-emerald-300 text-sm font-semibold">
                        {t.author_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold">{t.author_name}</div>
                      <div className="text-xs text-white/55">
                        {t.author_role} · {t.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-center mb-10">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/70">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-green-700/10 to-emerald-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,222,128,0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl">
            Ready to Scale Your Brand?
          </h2>
          <p className="mt-5 text-lg text-white/75">
            Start your 7-day free trial now. No credit card required.
          </p>
          <button
            onClick={openSignup}
            className="mt-8 inline-flex items-center gap-2 h-16 px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] font-bold text-lg shadow-[0_0_60px_rgba(74,222,128,0.5)] hover:scale-[1.03] active:scale-[0.99] transition-all"
          >
            Start My Free Trial
            <ArrowRight className="h-6 w-6" />
          </button>
          <p className="mt-5 text-sm text-emerald-300/80 animate-pulse">
            ⚡ Limited spots available this week
          </p>
        </div>
      </section>

      <SignupModal open={signupOpen} onOpenChange={setSignupOpen} />
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="relative rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-[#0d1612] to-[#0a0f0d] p-5 shadow-[0_0_60px_rgba(74,222,128,0.15)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <div className="ml-3 text-xs text-white/50">Growth Dashboard</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { l: "Reach", v: "+248%" },
            { l: "Engagement", v: "+412%" },
            { l: "Followers", v: "+87%" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/[0.04] p-3 border border-white/5">
              <div className="text-[10px] uppercase text-white/50">{s.l}</div>
              <div className="mt-1 text-lg font-bold text-emerald-300">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/5 p-4">
          <div className="text-xs text-white/60 mb-3">Last 7 days</div>
          <svg viewBox="0 0 300 100" className="w-full h-24">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(74,222,128)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="rgb(74,222,128)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 L40,70 L80,55 L120,60 L160,40 L200,30 L240,15 L300,5 L300,100 L0,100 Z"
              fill="url(#grad)"
            />
            <path
              d="M0,80 L40,70 L80,55 L120,60 L160,40 L200,30 L240,15 L300,5"
              fill="none"
              stroke="rgb(74,222,128)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

const trialSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    whatsapp: z
      .string()
      .trim()
      .min(7, "Enter a valid WhatsApp number")
      .max(25)
      .regex(/^[+0-9\s\-()]+$/, "Only digits, spaces, +, -, ()"),
    email: z.string().trim().email("Enter a valid email").max(255),
    facebookUrl: z
      .string()
      .trim()
      .url("Enter a valid URL (https://...)")
      .refine((u) => /facebook\.com|fb\.com/i.test(u), "Must be a Facebook page URL"),
    instagramHandle: z.string().trim().max(60).optional().or(z.literal("")),
    password: z.string().min(8, "Min 8 characters").max(72),
    confirmPassword: z.string(),
    agreed: z.literal(true, {
      errorMap: () => ({ message: "You must agree to continue" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type TrialForm = {
  fullName: string;
  whatsapp: string;
  email: string;
  facebookUrl: string;
  instagramHandle: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
};

function SignupModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<TrialForm>({
    fullName: "",
    whatsapp: "",
    email: "",
    facebookUrl: "",
    instagramHandle: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TrialForm, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof TrialForm>(k: K, v: TrialForm[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = (): boolean => {
    const r = trialSchema.safeParse(form);
    if (r.success) {
      setErrors({});
      return true;
    }
    const errs: Partial<Record<keyof TrialForm, string>> = {};
    for (const issue of r.error.issues) {
      const k = issue.path[0] as keyof TrialForm;
      if (!errs[k]) errs[k] = issue.message;
    }
    setErrors(errs);
    return false;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/client/dashboard`,
          data: {
            full_name: form.fullName,
            phone: form.whatsapp,
          },
        },
      });
      if (authError) {
        toast.error(authError.message);
        return;
      }
      const userId = authData.user?.id;
      if (!userId) {
        toast.error("Signup failed. Please try again.");
        return;
      }

      // Profile (best-effort; RLS requires session)
      await sb
        .from("client_profiles")
        .upsert(
          {
            id: userId,
            email: form.email.trim().toLowerCase(),
            full_name: form.fullName,
            phone: form.whatsapp,
            whatsapp_number: form.whatsapp,
            facebook_url: form.facebookUrl,
            instagram_handle: form.instagramHandle || null,
            is_active: true,
            trial_source: "landing_page",
          },
          { onConflict: "id" },
        );

      // Trial membership
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const { data: trialPlan } = await sb
        .from("membership_plans")
        .select("id")
        .eq("slug", "starter-growth")
        .maybeSingle();

      await sb.from("client_memberships").insert({
        client_id: userId,
        plan_id: trialPlan?.id ?? null,
        status: "active",
        is_trial: true,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        start_date: new Date().toISOString(),
        end_date: trialEndsAt.toISOString(),
        billing_cycle: "trial",
        amount: 0,
        payment_status: "trial",
      });

      // Google Sheets webhook
      try {
        const { data: settings } = await sb
          .from("site_settings")
          .select("value")
          .eq("key", "google_sheets_webhook_url")
          .maybeSingle();
        const raw = settings?.value;
        const webhookUrl =
          (raw && typeof raw === "object" && "value" in raw ? (raw as any).value : raw) || "";
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              full_name: form.fullName,
              email: form.email,
              whatsapp: form.whatsapp,
              facebook_url: form.facebookUrl,
              instagram_handle: form.instagramHandle,
              trial_started: new Date().toISOString(),
              trial_ends: trialEndsAt.toISOString(),
              source: "landing_page",
            }),
          });
        }
      } catch (e) {
        console.error("Sheet webhook failed:", e);
      }

      // Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "CompleteRegistration", {
          content_name: "7-Day Free Trial",
          value: 0,
          currency: "USD",
        });
        (window as any).fbq("trackCustom", "StartTrial", {
          trial_days: 7,
          plan: "free_trial",
        });
      }

      // Welcome notification
      await sb.from("client_notifications").insert({
        client_id: userId,
        title: "🎉 Welcome to LetUsGrow!",
        body: "Your 7-day free trial has started. Our team will reach out within 24 hours for your strategy call.",
        type: "success",
      });

      toast.success("Welcome! Your 7-day free trial has started.");
      onOpenChange(false);
      setTimeout(() => {
        navigate({ to: "/client/dashboard" });
      }, 800);
    } catch (err: any) {
      toast.error("Something went wrong: " + (err?.message ?? "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#0d1612] border-emerald-400/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Start Your 7-Day Free Trial</DialogTitle>
          <DialogDescription className="text-white/60">
            No credit card required. Cancel anytime.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <FormField label="Full Name *" error={errors.fullName}>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className={inputCls}
              autoComplete="name"
            />
          </FormField>
          <FormField label="WhatsApp Number *" error={errors.whatsapp}>
            <input
              type="tel"
              placeholder="+880 1XXXXXXXXX"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              className={inputCls}
              autoComplete="tel"
            />
          </FormField>
          <FormField label="Email Address *" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
          </FormField>
          <FormField label="Facebook Page URL *" error={errors.facebookUrl}>
            <input
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={form.facebookUrl}
              onChange={(e) => update("facebookUrl", e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Instagram Handle (optional)" error={errors.instagramHandle}>
            <input
              type="text"
              placeholder="@yourbrand"
              value={form.instagramHandle}
              onChange={(e) => update("instagramHandle", e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Password *" error={errors.password}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputCls + " pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirm Password *" error={errors.confirmPassword}>
            <div className="relative">
              <input
                type={showCpw ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className={inputCls + " pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowCpw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                tabIndex={-1}
              >
                {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <label className="flex items-start gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={(e) => update("agreed", e.target.checked as true)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent accent-emerald-500"
            />
            <span>
              I agree to the 7-day trial terms and{" "}
              <Link to="/privacy" className="text-emerald-300 underline">
                privacy policy
              </Link>
            </span>
          </label>
          {errors.agreed && (
            <p className="text-xs text-red-400 -mt-2">{errors.agreed}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] font-bold disabled:opacity-60 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating your trial…
              </>
            ) : (
              <>
                Start My 7-Day Free Trial <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.06] transition-colors";

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
