import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Sparkles, Lightbulb, Target, Sparkles as SparkIcon } from "lucide-react";

type Member = {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
  is_founder: boolean;
};

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    desc: "Clear reporting, honest conversations, no smoke and mirrors.",
  },
  {
    icon: Sparkles,
    title: "Excellence",
    desc: "Craftsmanship in every deliverable. We sweat the details.",
  },
  { icon: Lightbulb, title: "Innovation", desc: "We test, learn and ship faster than the market." },
  { icon: Target, title: "Results", desc: "Vanity metrics don't pay bills. We chase outcomes." },
];

const MILESTONES = [
  {
    year: "2019",
    title: "Founded in a small studio",
    desc: "Three operators, one mission: help good brands grow.",
  },
  {
    year: "2021",
    title: "First $1M client",
    desc: "Scaled a DTC brand from $0 to $1M in 9 months.",
  },
  { year: "2023", title: "Global expansion", desc: "Opened operations across 4 timezones." },
  { year: "2025", title: "50+ specialists", desc: "Built the team we always wanted to work with." },
];

export const Route = createLazyFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const [founders, setFounders] = useState<Member[]>([]);

  useEffect(() => {
    supabase
      .from("team_members")
      .select("id, name, role, photo_url, bio, is_founder")
      .eq("is_founder", true)
      .order("sort_order", { ascending: true })
      .limit(3)
      .then(({ data }) => setFounders((data ?? []) as Member[]));
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Our story"
        title="We help brands grow on purpose."
        subtitle="A team of operators, designers, and strategists who believe great marketing is part craft, part science."
      />

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium leading-relaxed text-center"
        >
          <span className="text-primary">"</span>
          We exist to make growth feel less like a guessing game and more like a system you can
          trust.
          <span className="text-primary">"</span>
        </motion.blockquote>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-6">
          What we value
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass rounded-2xl p-5 sm:p-6 hover:shadow-elegant transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-8">Milestones</h2>
        <ol className="relative border-l border-border pl-6 space-y-10">
          {MILESTONES.map((m, i) => (
            <motion.li
              key={m.year}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <p className="text-xs uppercase tracking-wider text-primary font-medium">{m.year}</p>
              <h3 className="mt-1 text-xl font-display font-semibold">{m.title}</h3>
              <p className="mt-1 text-muted-foreground">{m.desc}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Founders preview */}
      {founders.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold">Meet the founders</h2>
            <Link
              to="/team"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View full team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {founders.map((f) => (
              <div key={f.id} className="glass rounded-2xl p-5">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                  {f.photo_url ? (
                    <img src={f.photo_url} alt={f.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-amber-300/20 flex items-center justify-center">
                      <SparkIcon className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-primary">Co-Founder</p>
                <h3 className="mt-1 text-lg font-display font-semibold">{f.name}</h3>
                <p className="text-sm text-muted-foreground">{f.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 sm:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold">
            Let's build something worth talking about.
          </h2>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/contact">
              Start a conversation <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
