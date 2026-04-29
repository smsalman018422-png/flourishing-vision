import { motion } from "framer-motion";

const steps = [
  { n: "01", t: "Diagnose", d: "Audit your funnel, channels, and analytics. Surface the levers that actually move the needle." },
  { n: "02", t: "Design", d: "Co-build a 90-day roadmap with weekly experiments, owners, and a single source of truth." },
  { n: "03", t: "Deploy", d: "Ship campaigns, content, and code in tight sprints — measured against real revenue impact." },
  { n: "04", t: "Compound", d: "Double down on what works, retire what doesn't, and re-invest the winnings into new bets." },
];

export function Process() {
  return (
    <section id="process" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">How we work</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            A loop, not a <span className="text-gradient">funnel</span>.
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative glass rounded-2xl p-6 hover:border-accent/40 transition-colors"
            >
              <div className="text-xs font-mono text-accent">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
