import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const cases = [
  { brand: "Verdana Skincare", tag: "DTC Beauty", metric: "+482%", label: "organic revenue / 9 mo", tone: "from-primary/40 via-secondary/30 to-accent/20" },
  { brand: "Northwind Capital", tag: "Fintech", metric: "−63%", label: "CAC across paid", tone: "from-accent/30 via-primary/30 to-secondary/40" },
  { brand: "Atlas Outdoor", tag: "Marketplace", metric: "12.4M", label: "monthly impressions", tone: "from-secondary/40 via-accent/20 to-primary/30" },
  { brand: "Olive & Oat", tag: "F&B Retail", metric: "$4.1M", label: "new pipeline / 6 mo", tone: "from-primary/30 via-accent/30 to-secondary/30" },
];

export function Work() {
  return (
    <section id="work" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">Selected work</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
              Outcomes our clients <span className="text-gradient">brag about</span>.
            </h2>
          </div>
          <a href="#" className="text-sm font-medium inline-flex items-center gap-1 hover:text-accent transition-colors">
            View all case studies <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {cases.map((c, i) => (
            <motion.a
              key={c.brand}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative glass rounded-3xl overflow-hidden h-72 sm:h-80 flex flex-col justify-end p-7"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.tone} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute inset-0 grid-bg opacity-50" />
              <div className="absolute top-6 right-6 grid place-items-center h-10 w-10 rounded-full glass-strong group-hover:rotate-45 transition-transform duration-500">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div className="relative">
                <div className="text-xs font-medium uppercase tracking-wider text-foreground/70">{c.tag}</div>
                <div className="mt-1 text-2xl font-display font-semibold">{c.brand}</div>
                <div className="mt-6 flex items-baseline gap-3">
                  <div className="text-5xl font-display font-bold text-gradient">{c.metric}</div>
                  <div className="text-sm text-foreground/80">{c.label}</div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
