import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PLANS = [
  {
    name: "Starter",
    monthly: 499,
    tagline: "For founders testing the waters",
    features: ["1 channel managed", "Weekly reporting", "Up to 8 creatives/mo", "Email support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    monthly: 999,
    tagline: "Most popular for scaling brands",
    features: ["3 channels managed", "Twice-weekly reporting", "Up to 24 creatives/mo", "Slack support", "Quarterly strategy"],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    tagline: "Custom growth pods",
    features: ["Unlimited channels", "Realtime dashboards", "Unlimited creatives", "Dedicated team", "On-call strategy"],
    cta: "Book a Call",
    popular: false,
  },
];

const COMPARISON = [
  { feature: "Channels managed", starter: "1", growth: "3", enterprise: "Unlimited" },
  { feature: "Creatives per month", starter: "8", growth: "24", enterprise: "Unlimited" },
  { feature: "Reporting cadence", starter: "Weekly", growth: "Twice weekly", enterprise: "Realtime" },
  { feature: "Strategy reviews", starter: "—", growth: "Quarterly", enterprise: "Monthly" },
  { feature: "Dedicated team", starter: false, growth: false, enterprise: true },
  { feature: "Slack channel", starter: false, growth: true, enterprise: true },
  { feature: "On-call support", starter: false, growth: false, enterprise: true },
];

const FAQS = [
  { q: "Are there long-term contracts?", a: "No. All plans are month-to-month after a 90-day initial engagement." },
  { q: "Can I switch plans later?", a: "Anytime. Upgrades are prorated; downgrades take effect on your next cycle." },
  { q: "Do you work with agencies?", a: "Yes — we partner with agencies as a white-label growth team." },
  { q: "What's included in onboarding?", a: "Audit, strategy session, channel setup, creative kickoff, and a 30-day roadmap." },
  { q: "Do you guarantee results?", a: "We guarantee process, transparency and effort. Outcomes depend on many factors we forecast together." },
  { q: "Which industries do you serve?", a: "Mostly DTC, SaaS, and services brands doing $500k–$50M in revenue." },
];

export const Route = createLazyFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        subtitle="Pick the plan that matches your stage. Upgrade, downgrade or pause anytime."
      />

      {/* Billing toggle */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex justify-center">
        <div className="glass rounded-full p-1 flex items-center gap-1 text-sm">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 py-2 rounded-full min-h-[40px] font-medium transition-colors ${!yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 py-2 rounded-full min-h-[40px] font-medium transition-colors flex items-center gap-2 ${yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Yearly <span className="text-[10px] uppercase tracking-wider rounded bg-primary/20 text-primary px-1.5 py-0.5">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.slice() // Popular card first on mobile
            .sort((a, b) => (a.popular === b.popular ? 0 : a.popular ? -1 : 1))
            .map((p) => {
              const popular = p.popular;
              const price = p.monthly == null ? null : yearly ? Math.round(p.monthly * 0.8) : p.monthly;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`relative rounded-3xl p-6 sm:p-8 ${
                    popular
                      ? "lg:order-2 bg-gradient-to-b from-primary/10 to-transparent ring-2 ring-primary shadow-glow"
                      : "lg:order-1 glass"
                  } ${p.name === "Enterprise" ? "lg:order-3" : ""}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-display font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
                  <div className="mt-6 flex items-baseline gap-2">
                    {price == null ? (
                      <span className="text-4xl font-display font-semibold">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl sm:text-5xl font-display font-semibold">${price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                  {yearly && price != null && (
                    <p className="mt-1 text-xs text-primary">Billed annually — save 20%</p>
                  )}
                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" className="mt-8 w-full" variant={popular ? "default" : "outline"}>
                    <Link to="/contact">{p.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </motion.div>
              );
            })}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Compare features</h2>
        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-2xl glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-4 font-medium text-muted-foreground">Feature</th>
                <th className="p-4 font-medium">Starter</th>
                <th className="p-4 font-medium text-primary">Growth</th>
                <th className="p-4 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-t border-border">
                  <td className="p-4 text-muted-foreground">{row.feature}</td>
                  <td className="p-4">{renderCell(row.starter)}</td>
                  <td className="p-4">{renderCell(row.growth)}</td>
                  <td className="p-4">{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile collapsible */}
        <div className="md:hidden">
          <Accordion type="single" collapsible className="space-y-2">
            {(["Starter", "Growth", "Enterprise"] as const).map((plan) => (
              <AccordionItem key={plan} value={plan} className="glass rounded-2xl border-0 px-4">
                <AccordionTrigger className="min-h-[44px]">{plan} features</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pb-2">
                    {COMPARISON.map((row) => {
                      const v = plan === "Starter" ? row.starter : plan === "Growth" ? row.growth : row.enterprise;
                      return (
                        <li key={row.feature} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{row.feature}</span>
                          <span>{renderCell(v)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Frequently asked</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-2xl border-0 px-4">
              <AccordionTrigger className="text-left min-h-[44px]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl glass p-10 sm:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold">Still have questions?</h2>
          <p className="mt-3 text-muted-foreground">Talk to us — we'll match you with the right plan.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/contact">Talk to us <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function renderCell(v: string | boolean) {
  if (v === true) return <Check className="h-4 w-4 text-primary" />;
  if (v === false) return <X className="h-4 w-4 text-muted-foreground/50" />;
  return <span>{v}</span>;
}
