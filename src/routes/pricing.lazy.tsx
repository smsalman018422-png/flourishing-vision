import { createLazyFileRoute, Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { useEffect, useMemo, useState } from "react";
import type { PublicPackage } from "@/functions/packages.types";

const pricingRouteApi = getRouteApi("/pricing");
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MessageCircle, LogIn, UserPlus, Loader2 } from "lucide-react";
import { PayPalCheckout, type PayPalCaptureDetails } from "@/components/PayPalCheckout";
import { toast } from "sonner";
import {
  Check,
  ArrowRight,
  Sparkles,
  ChevronDown,
  TrendingUp,
  Clock,
  BadgeCheck,
  Shield,
  Crown,
  Sprout,
  Rocket,
  Star,
  Zap,
  Target,
  Layers,
  Award,
  Diamond,
  Flame,
  Gem,
  Heart,
  Trophy,
  Briefcase,
  Globe,
  Code,
  Palette,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { buildWhatsAppHref, useSiteSettings } from "@/hooks/useSiteSettings";
import {
  trackInitiateCheckout,
  trackPurchase,
  trackViewContent,
  trackPackageView,
  trackCTAClick,
} from "@/lib/meta-pixel";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Sprout, Rocket, Shield, Crown, Star, Zap, TrendingUp, Target,
  Layers, Award, Diamond, Flame, Gem, Heart, Trophy, Briefcase, Globe,
  Code, Palette,
};

type FeatureItem = { text: string; type: "feature" | "bonus" };

type Pkg = {
  id: string;
  category: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  tagline: string | null;
  description: string | null;
  icon_name: string;
  features: FeatureItem[];
  best_for: string | null;
  is_popular: boolean;
  is_premium: boolean;
  is_visible: boolean;
  order_index: number;
  cta_text: string;
  cta_link: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  social_media: "Social Media",
  web_development: "Web Development",
  creator: "Creator",
  custom: "Custom",
};

const FAQS = [
  {
    q: "Can I upgrade my plan anytime?",
    a: "Absolutely. You can upgrade at any point — we'll prorate the difference and roll your account onto the new plan immediately.",
  },
  {
    q: "What platforms do you manage?",
    a: "We manage Facebook, Instagram, TikTok, LinkedIn, X (Twitter), YouTube and Pinterest. The number of platforms included depends on your plan.",
  },
  {
    q: "How long until I see results?",
    a: "Most clients see meaningful engagement growth within 30–45 days. Paid ads typically show measurable ROI within the first 60 days.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts on any monthly plan. Cancel any time before your next billing cycle.",
  },
  {
    q: "Do you offer custom packages?",
    a: "Yes — talk to our team and we'll tailor a plan to your goals, channels and budget.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, debit cards, bank transfers, PayPal and Wise for international clients.",
  },
];

export const Route = createLazyFileRoute("/pricing")({
  component: PricingPage,
});

function normalizeFeatures(raw: unknown): FeatureItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { text: item, type: "feature" as const };
      if (item && typeof item === "object") {
        const obj = item as { text?: unknown; type?: unknown };
        const text = typeof obj.text === "string" ? obj.text : "";
        const type = obj.type === "bonus" ? "bonus" : "feature";
        return { text, type } as FeatureItem;
      }
      return null;
    })
    .filter((f): f is FeatureItem => !!f && !!f.text);
}

const ALL_CATEGORIES = ["social_media", "web_development", "creator"];

const COMING_SOON_LABELS: Record<string, string> = {
  web_development: "Web Development packages launching soon — talk to our team for a custom build.",
  creator: "Creator packages launching soon — get on the early-access list.",
};

function PricingPage() {
  const initial = pricingRouteApi.useLoaderData() as PublicPackage[];
  const initialPkgs = useMemo<Pkg[]>(
    () => (initial ?? []).map((d) => ({ ...d, features: normalizeFeatures(d.features) })) as Pkg[],
    [initial],
  );
  const [yearly, setYearly] = useState(false);
  const [packages, setPackages] = useState<Pkg[]>(initialPkgs);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("social_media");
  const [purchaseTarget, setPurchaseTarget] = useState<Pkg | null>(null);
  const [autoOpenedPkg, setAutoOpenedPkg] = useState<string | null>(null);
  const search = pricingRouteApi.useSearch();

  useEffect(() => {
    trackViewContent({
      content_name: "Packages Page",
      content_category: "Pricing",
      content_type: "product_group",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const normalizeCategory = (c: string | null | undefined) =>
      !c ? "social_media" : c.toLowerCase().replace(/\s+/g, "_").replace(/-+/g, "_");
    const load = async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        setPackages(
          (data as any[]).map((r) => {
            const monthly = Number(r.monthly_price ?? r.price_monthly ?? 0);
            const yearly = Number(r.yearly_price ?? r.price_yearly ?? 0);
            const features = Array.isArray(r.features) ? r.features : [];
            const bonus = Array.isArray(r.bonus_features) ? r.bonus_features : [];
            const merged: FeatureItem[] = [
              ...features.map((t: any) => ({
                text: typeof t === "string" ? t : String(t?.text ?? ""),
                type: "feature" as const,
              })),
              ...bonus.map((t: any) => ({
                text: typeof t === "string" ? t : String(t?.text ?? ""),
                type: "bonus" as const,
              })),
            ].filter((f) => f.text);
            return {
              id: r.id,
              category: normalizeCategory(r.category),
              name: r.name,
              slug: r.slug,
              price_monthly: monthly,
              price_yearly: yearly,
              tagline: null,
              description: r.description ?? null,
              icon_name: "Sparkles",
              features: merged,
              best_for: r.best_for ?? null,
              is_popular: !!r.is_popular,
              is_premium: false,
              is_visible: r.is_visible !== false,
              order_index: r.sort_order ?? 0,
              cta_text: r.cta_text || "Get Started",
              cta_link: "/contact",
            } as Pkg;
          }),
        );
      }
    };

    // Always refetch on mount so admin updates show immediately.
    load();

    const channel = supabase
      .channel("membership-plans-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membership_plans" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!search.pkg || autoOpenedPkg === search.pkg || packages.length === 0) return;
    const match = packages.find((p) => p.slug === search.pkg || p.id === search.pkg);
    if (!match) return;
    setActiveCategory(match.category);
    setPurchaseTarget(match);
    setAutoOpenedPkg(search.pkg);
  }, [search.pkg, autoOpenedPkg, packages]);


  // Always show all known categories so "coming soon" tabs are visible.
  const categories = useMemo(() => {
    const set = new Set(packages.map((p) => p.category));
    const extras = Array.from(set).filter((c) => !ALL_CATEGORIES.includes(c));
    return [...ALL_CATEGORIES, ...extras];
  }, [packages]);

  const visiblePackages = useMemo(
    () => packages.filter((p) => p.category === activeCategory),
    [packages, activeCategory],
  );

  const isComingSoon = visiblePackages.length === 0 && !loading && activeCategory in COMING_SOON_LABELS;

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative pt-20 sm:pt-28 pb-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-primary/15 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {CATEGORY_LABELS[activeCategory] ?? "Packages"}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight"
          >
            Packages Built to <span className="text-primary">Scale Your Brand</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            From startups to enterprise — choose the plan that matches your growth goals.
          </motion.p>
        </div>
      </section>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex justify-center">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
                  activeCategory === c
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                    : "bg-card/60 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 flex justify-center">
        <LayoutGroup id="billing-toggle">
          <div className="relative inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 backdrop-blur-xl p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`relative px-7 sm:px-8 py-2.5 text-sm sm:text-base font-medium rounded-full min-h-[44px] transition-colors ${
                !yearly ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {!yearly && (
                <motion.span
                  layoutId="billing-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <span className="relative z-10">Monthly</span>
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`relative px-7 sm:px-8 py-2.5 text-sm sm:text-base font-medium rounded-full min-h-[44px] transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                yearly ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {yearly && (
                <motion.span
                  layoutId="billing-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <span className="relative z-10">Yearly</span>
              <span
                className={`relative z-10 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  yearly
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/20 text-primary"
                }`}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </LayoutGroup>
      </div>

      {/* PLAN CARDS */}
      <section className="relative mx-auto max-w-[100rem] px-4 sm:px-6 py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[1100px] rounded-full bg-primary/10 blur-[160px]" />
        </div>

        {loading ? (
          <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[600px] rounded-3xl" />
            ))}
          </div>
        ) : visiblePackages.length === 0 ? (
          <div className="relative max-w-2xl mx-auto text-center py-16 px-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/15 text-primary">
              <Sparkles className="h-3 w-3" /> Coming Soon
            </span>
            <h3 className="mt-4 text-2xl font-display font-semibold">
              {CATEGORY_LABELS[activeCategory] ?? activeCategory} packages are on the way
            </h3>
            <p className="mt-3 text-muted-foreground">
              {isComingSoon
                ? COMING_SOON_LABELS[activeCategory]
                : "No packages available in this category yet."}
            </p>
            <Button asChild className="mt-6">
              <Link to="/contact">Talk to our team</Link>
            </Button>
          </div>
        ) : (
          <div
            className={`relative grid grid-cols-1 sm:grid-cols-2 ${
              visiblePackages.length >= 4
                ? "xl:grid-cols-4"
                : visiblePackages.length === 3
                  ? "lg:grid-cols-3"
                  : ""
            } gap-6 lg:gap-5 xl:items-stretch`}
          >
            {visiblePackages.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                yearly={yearly}
                index={i}
                onPurchase={() => {
                  const price = yearly ? plan.price_yearly : plan.price_monthly;
                  trackPackageView(plan.name, price);
                  trackInitiateCheckout({ content_name: plan.name, value: price });
                  trackCTAClick(`Get Started - ${plan.name}`, "Pricing");
                  setPurchaseTarget(plan);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* CUSTOM */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary mx-auto" />
            <h2 className="mt-4 text-3xl sm:text-4xl font-display font-semibold">
              Need a Custom Package?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              We create tailored solutions for unique business needs. Mix and match services across
              all our offerings.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/contact">
                Talk to Our Team <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-xs font-medium text-primary uppercase tracking-[0.3em]">FAQ</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-display font-semibold">
            Frequently asked
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl px-5"
            >
              <AccordionTrigger className="text-left min-h-[48px] font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* GUARANTEE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Shield,
              title: "30-Day Satisfaction Guarantee",
              text: "Not happy? We'll make it right or refund your first month.",
            },
            {
              icon: Clock,
              title: "14-Day Free Trial on Starter",
              text: "Try the Starter Growth plan risk-free for two weeks.",
            },
            {
              icon: BadgeCheck,
              title: "Cancel Anytime",
              text: "No long-term contracts. Pause or cancel any time.",
            },
          ].map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <g.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{g.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{g.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-card/60 to-accent/10 backdrop-blur-xl p-10 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold">
            Ready to scale your brand?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join hundreds of brands already growing with us.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/contact">
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <PurchaseModal
        plan={purchaseTarget}
        yearly={yearly}
        onClose={() => setPurchaseTarget(null)}
      />
    </PageShell>
  );
}

function PlanCard({
  plan,
  yearly,
  index,
  onPurchase,
}: {
  plan: Pkg;
  yearly: boolean;
  index: number;
  onPurchase: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[plan.icon_name] ?? Sparkles;
  const monthlyDisplay = yearly
    ? plan.price_yearly > 0
      ? Math.round(plan.price_yearly / 12)
      : 0
    : plan.price_monthly;
  const showStrikethrough = yearly && plan.price_monthly > monthlyDisplay;

  const regularFeatures = plan.features.filter((f) => f.type === "feature");
  const bonuses = plan.features.filter((f) => f.type === "bonus");

  const visibleCount = 7;
  const visibleFeatures = expanded ? regularFeatures : regularFeatures.slice(0, visibleCount);
  const hasMore = regularFeatures.length > visibleCount || bonuses.length > 0;

  void 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative ${plan.is_popular ? "xl:-my-3 xl:scale-[1.03]" : ""}`}
    >
      {plan.is_popular && (
        <>
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary via-accent to-primary opacity-90 blur-md" />
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary to-accent" />
        </>
      )}
      {plan.is_premium && (
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-amber-400/60 via-amber-200/30 to-amber-500/60" />
      )}

      <div
        className={`relative h-full flex flex-col rounded-3xl border bg-card/70 backdrop-blur-xl p-6 lg:p-7 transition-all duration-300 group-hover:-translate-y-1 ${
          plan.is_popular
            ? "border-transparent shadow-[0_0_60px_-15px_oklch(0.62_0.16_150/0.7)]"
            : plan.is_premium
              ? "border-transparent shadow-[0_0_50px_-20px_rgba(251,191,36,0.5)]"
              : "border-border/60 group-hover:border-primary/40 group-hover:shadow-[0_0_40px_-15px_oklch(0.62_0.16_150/0.5)]"
        }`}
      >
        {plan.is_popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-primary/40">
              <Sparkles className="h-3 w-3" /> Most Popular
            </span>
          </div>
        )}
        {plan.is_premium && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-amber-500/30">
              <Crown className="h-3 w-3" /> Premium
            </span>
          </div>
        )}

        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
            plan.is_premium
              ? "bg-amber-400/15 text-amber-400"
              : plan.is_popular
                ? "bg-primary/20 text-primary"
                : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-2xl font-bold font-display">{plan.name}</h3>
        {plan.tagline && (
          <p className="mt-1.5 text-sm text-muted-foreground min-h-[40px]">{plan.tagline}</p>
        )}

        <div className="mt-5 min-h-[68px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={yearly ? "y" : "m"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-end gap-2 flex-wrap"
            >
              <span
                className={`text-4xl lg:text-5xl font-black tracking-tight ${
                  plan.is_premium ? "text-amber-400" : ""
                }`}
              >
                ${monthlyDisplay.toLocaleString()}
              </span>
              <span className="text-muted-foreground mb-1.5 text-sm">/month</span>
              {showStrikethrough && (
                <span className="text-muted-foreground line-through text-sm mb-1.5">
                  ${plan.price_monthly}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
          {yearly && plan.price_yearly > 0 && (
            <p className="text-xs text-primary font-medium mt-1">
              Billed yearly · ${plan.price_yearly.toLocaleString()}/yr · Save 20%
            </p>
          )}
        </div>

        <button onClick={onPurchase} className={ctaClass(plan)} type="button">
          {plan.cta_text}
        </button>

        <ul className="mt-6 space-y-2.5 flex-1">
          {visibleFeatures.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm">
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  plan.is_popular ? "bg-primary" : "bg-primary/15"
                }`}
              >
                <Check
                  className={`h-2.5 w-2.5 ${
                    plan.is_popular ? "text-primary-foreground" : "text-primary"
                  }`}
                  strokeWidth={4}
                />
              </span>
              <span className="text-foreground/90">{f.text}</span>
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? "Show less" : `View all ${regularFeatures.length} features`}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}

        <AnimatePresence initial={false}>
          {expanded && bonuses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className={`mt-4 rounded-2xl p-4 border ${
                  plan.is_premium
                    ? "border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent"
                    : "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    plan.is_premium ? "text-amber-400" : "text-primary"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {plan.is_premium ? "Premium Bonuses" : "Bonus"}
                </p>
                <ul className="mt-3 space-y-2">
                  {bonuses.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Sparkles
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          plan.is_premium ? "text-amber-400" : "text-primary"
                        }`}
                      />
                      <span>{b.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {plan.best_for && (
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Best For
            </p>
            <p className="mt-1.5 text-xs text-foreground/80">{plan.best_for}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ctaClass(plan: Pkg) {
  return `mt-5 inline-flex items-center justify-center w-full rounded-full px-6 py-3 font-semibold transition text-sm min-h-[44px] ${
    plan.is_popular
      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30"
      : plan.is_premium
        ? "border-2 border-amber-400/60 text-amber-400 hover:bg-amber-400/10"
        : "border border-primary/40 text-primary hover:bg-primary/10"
  }`;
}

function PurchaseModal({
  plan,
  yearly: initialYearly,
  onClose,
}: {
  plan: Pkg | null;
  yearly: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [yearly, setYearly] = useState(initialYearly);
  const [submitting, setSubmitting] = useState(false);
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!plan) return;
    setYearly(initialYearly);
    setAuthState("loading");
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session?.user ? "in" : "out");
    });
  }, [plan, initialYearly]);

  if (!plan) return null;

  const price = yearly ? plan.price_yearly : plan.price_monthly;
  const cycle = yearly ? "yearly" : "monthly";

  const handlePaid = async (orderId: string, details: PayPalCaptureDetails) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast.error("Please sign in first");
        return;
      }
      const res = await fetch("/api/purchase-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          package_id: plan.id,
          billing_cycle: cycle,
          paypal_order_id: orderId,
          payer_email: details.payer?.email_address,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: boolean; redirect_url?: string; error?: string }
        | null;
      if (!res.ok || !body?.ok) {
        toast.error(body?.error || "Could not record payment");
        return;
      }
      toast.success("Payment received! Your package will be activated shortly.");
      trackPurchase({ content_name: plan.name, value: price });
      onClose();
      navigate({ to: body.redirect_url ?? "/client/dashboard/packages" });
    } finally {
      setSubmitting(false);
    }
  };

  const waMessageText = `Hi! I'd like to purchase the ${plan.name} package (${cycle}, $${price}).`;
  const waHref = buildWhatsAppHref(settings?.contact_whatsapp, waMessageText);
  const contactHref = `/contact?subject=${encodeURIComponent("Package: " + plan.name)}`;

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {authState === "loading" ? (
          <>
            <DialogHeader>
              <DialogTitle>{plan.name}</DialogTitle>
              <DialogDescription>Checking your account before checkout.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing checkout…
            </div>
          </>
        ) : authState === "out" ? (
          <>
            <DialogHeader>
              <DialogTitle>Sign in to purchase</DialogTitle>
              <DialogDescription>
                Create an account or sign in to purchase the {plan.name} package.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                onClick={() => {
                  onClose();
                  navigate({
                    to: "/client/login",
                    search: { tab: "login", redirect: "/pricing", pkg: plan.slug } as never,
                  });
                }}
              >
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  navigate({
                    to: "/client/login",
                    search: { tab: "signup", redirect: "/pricing", pkg: plan.slug } as never,
                  });
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Create Account
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{plan.name}</DialogTitle>
              <DialogDescription>
                {plan.tagline ?? "Choose your billing cycle and pay securely with PayPal."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-1 grid grid-cols-2 text-sm font-medium">
              <button
                onClick={() => setYearly(false)}
                className={`py-2 rounded-lg transition ${!yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`py-2 rounded-lg transition ${yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Yearly · save 20%
              </button>
            </div>

            {submitting && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Recording payment…
              </div>
            )}

            {price > 0 ? (
              <PayPalCheckout
                key={`${plan.id}-${cycle}`}
                packageName={plan.name}
                amount={price}
                billingCycle={cycle}
                onSuccess={handlePaid}
              />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                This plan has no online price. Please contact us for a quote.
              </div>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button asChild variant="outline" disabled={!waHref}>
                  <a href={waHref ?? "#"} target="_blank" rel="noopener noreferrer" aria-disabled={!waHref}>
                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <Link to={contactHref}>Custom Quote</Link>
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

