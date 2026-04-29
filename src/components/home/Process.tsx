import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, Map, Rocket, TrendingUp, type LucideIcon } from "lucide-react";

type Step = { n: string; t: string; d: string; Icon: LucideIcon };

const steps: Step[] = [
  { n: "01", t: "Discovery", d: "Deep dive into your brand, audience, and goals", Icon: Search },
  { n: "02", t: "Strategy", d: "Custom roadmap designed for measurable growth", Icon: Map },
  { n: "03", t: "Execution", d: "Our team launches campaigns across all channels", Icon: Rocket },
  { n: "04", t: "Optimization", d: "Continuous testing and scaling for maximum ROI", Icon: TrendingUp },
];

export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="process" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-[0.3em]">How we work</p>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Our Proven <span className="text-primary">4-Step</span> Growth Process
          </h2>
        </motion.div>

        <div ref={ref} className="relative mt-20">
          {/* Connecting line — desktop horizontal */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px px-[12.5%]">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-border/40" />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
                style={{ originX: 0 }}
                className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/40"
              />
            </div>
          </div>

          {/* Connecting line — mobile vertical */}
          <div className="lg:hidden absolute top-0 bottom-0 left-12 w-px">
            <div className="absolute inset-0 bg-border/40" />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
              style={{ originY: 0 }}
              className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.2 }}
                className="relative flex lg:flex-col items-start lg:items-center gap-6 lg:gap-0 lg:text-center pl-0 lg:pl-0"
              >
                {/* Big background number */}
                <span
                  aria-hidden
                  className="hidden lg:block absolute -top-10 left-1/2 -translate-x-1/2 text-[140px] font-black leading-none text-primary/5 select-none pointer-events-none"
                >
                  {s.n}
                </span>

                {/* Step circle with pulse */}
                <div className="relative shrink-0 z-10">
                  <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2.5s" }} />
                  <span className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
                  <div className="relative h-24 w-24 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]">
                    <s.Icon className="h-9 w-9 text-primary" strokeWidth={1.75} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 lg:mt-8">
                  <div className="lg:hidden text-3xl font-black text-primary/20 mb-1">{s.n}</div>
                  <p className="text-xs font-mono text-primary tracking-widest uppercase mb-2 hidden lg:block">
                    Step {s.n}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight">{s.t}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed lg:max-w-[220px] lg:mx-auto">
                    {s.d}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
