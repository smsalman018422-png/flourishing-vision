import { motion } from "framer-motion";
import { Hash, Target, Search, Sparkles, Palette, BarChart, ArrowRight, type LucideIcon } from "lucide-react";

type Service = {
  Icon: LucideIcon;
  title: string;
  desc: string;
};

const services: Service[] = [
  { Icon: Hash, title: "Social Media Marketing", desc: "Build engaged communities across all platforms." },
  { Icon: Target, title: "Paid Advertising", desc: "Meta, Google, TikTok ads with proven ROI." },
  { Icon: Search, title: "SEO & Content", desc: "Rank higher and convert better with strategic content." },
  { Icon: Sparkles, title: "Brand Strategy", desc: "Position your brand to dominate your niche." },
  { Icon: Palette, title: "Creative Design", desc: "Stunning visuals that stop the scroll." },
  { Icon: BarChart, title: "Analytics & Reporting", desc: "Data-driven insights that drive decisions." },
];

export function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Services</p>

          <h2 className="mt-3 inline-block text-4xl sm:text-5xl font-bold tracking-tight relative">
            What We Do Best
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute left-0 -bottom-2 h-1 w-full origin-left rounded-full bg-gradient-primary shadow-glow"
            />
          </h2>

          <p className="mt-6 text-muted-foreground">
            Six disciplines, one integrated team — tuned to compound revenue, not just deliverables.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.a
              key={s.title}
              href="#contact"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="group relative glass rounded-2xl p-7 overflow-hidden transition-all duration-300
                         hover:border-accent/60 hover:shadow-glow hover:bg-card/40"
            >
              {/* glow ring */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ boxShadow: "inset 0 0 0 1px oklch(0.82 0.19 145 / 0.45)" }} />
              <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-accent/25 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="grid place-items-center h-12 w-12 rounded-full bg-gradient-primary shadow-glow
                             group-hover:rotate-6 transition-transform duration-300"
                >
                  <s.Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
                </motion.div>

                <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent
                                 group-hover:gap-2.5 transition-all">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
