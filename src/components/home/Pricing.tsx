import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  monthly: number | null;
  yearly: number | null;
  customLabel?: string;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 499,
    yearly: 399,
    tagline: "For brands ready to start growing",
    features: [
      "2 Social Media Platforms",
      "20 Posts/month",
      "Basic Ad Management ($500 ad budget)",
      "Monthly Strategy Call",
      "Email Support",
      "Monthly Reports",
    ],
    cta: "Get Started",
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 999,
    yearly: 799,
    tagline: "Our most popular package",
    features: [
      "4 Social Media Platforms",
      "40 Posts/month",
      "Advanced Ads ($2,000 ad budget)",
      "Bi-weekly Strategy Calls",
      "WhatsApp Priority Support",
      "Weekly Reports + Analytics",
    ],
    cta: "Most Popular — Get Started",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: null,
    yearly: null,
    customLabel: "Custom",
    tagline: "Tailored to your scale",
    features: [
      "All Platforms Covered",
      "Unlimited Content",
      "Full Ad Management",
      "Daily Reports",
      "Dedicated Account Manager",
      "Priority 24/7 Support",
      "Custom Strategy",
    ],
    cta: "Book a Call",
  },
];

const scrollToContact = () => {
  const el = document.querySelector("#contact") || document.querySelector("#cta");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-[0.3em]">Pricing</p>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Simple, <span className="text-primary">Scalable</span> Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the package that fits your stage. Upgrade or downgrade anytime.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="relative inline-flex items-center rounded-full border border-border/60 bg-card/60 backdrop-blur-xl p-1">
            <button
              onClick={() => setYearly(false)}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition ${
                !yearly ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition flex items-center gap-2 ${
                yearly ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  yearly ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"
                }`}
              >
                SAVE 20%
              </span>
            </button>
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute inset-y-1 rounded-full bg-primary"
              style={{
                left: yearly ? "50%" : "0.25rem",
                right: yearly ? "0.25rem" : "50%",
              }}
            />
          </div>
        </div>

        {/* Cards */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:items-center">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative ${p.popular ? "lg:-my-4 lg:scale-[1.04]" : ""}`}
            >
              {/* Popular glow */}
              {p.popular && (
                <>
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary via-primary/60 to-primary opacity-100 blur-sm" />
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary to-primary/40" />
                </>
              )}

              <div
                className={`relative h-full rounded-3xl border bg-card/70 backdrop-blur-xl p-8 transition-all duration-300 group-hover:-translate-y-2 ${
                  p.popular
                    ? "border-transparent shadow-[0_0_60px_-15px_hsl(var(--primary)/0.6)] group-hover:shadow-[0_0_80px_-15px_hsl(var(--primary)/0.8)]"
                    : "border-border/60 group-hover:border-primary/40 group-hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)]"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wider uppercase shadow-lg shadow-primary/40">
                      <Sparkles className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}

                {/* Name + tagline */}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

                {/* Price */}
                <div className="mt-6 h-20 flex items-end gap-2">
                  {p.monthly === null ? (
                    <div className="text-5xl font-black tracking-tight">{p.customLabel}</div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={yearly ? "y" : "m"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-end gap-1"
                      >
                        <span className="text-5xl font-black tracking-tight">
                          ${yearly ? p.yearly : p.monthly}
                        </span>
                        <span className="text-muted-foreground mb-2">/month</span>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
                {p.monthly !== null && yearly && (
                  <p className="text-xs text-primary font-medium -mt-2">
                    Billed yearly · ${(p.yearly! * 12).toLocaleString()}/yr
                  </p>
                )}

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                          p.popular ? "bg-primary" : "bg-primary/15"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${p.popular ? "text-primary-foreground" : "text-primary"}`}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={scrollToContact}
                  className={`mt-8 w-full rounded-full px-6 py-3 font-semibold transition ${
                    p.popular
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30"
                      : "bg-secondary/60 hover:bg-secondary text-foreground border border-border"
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All packages include a <span className="text-primary font-medium">free strategy call</span> +{" "}
          <span className="text-primary font-medium">30-day satisfaction guarantee</span>
        </p>
      </div>
    </section>
  );
}
