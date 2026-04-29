import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const stats: Stat[] = [
  { value: 500, suffix: "+", label: "Happy Clients Globally" },
  { value: 2, prefix: "$", suffix: "M+", label: "Revenue Generated" },
  { value: 350, suffix: "%", label: "Average ROI Increase" },
  { value: 98, suffix: "%", label: "Client Retention Rate" },
];

function AnimatedNumber({
  to,
  prefix = "",
  suffix = "",
  start,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  start: boolean;
}) {
  const mv = useMotionValue(0);
  // Use one decimal when the target is < 10 (e.g. "$2M+") for smoother feel
  const display = useTransform(mv, (v) =>
    `${prefix}${to < 10 ? v.toFixed(1) : Math.round(v).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    if (!start) return;
    const controls = animate(mv, to, { duration: 2, ease: [0.2, 0.8, 0.2, 1] });
    return controls.stop;
  }, [start, to, mv]);

  return <motion.span>{display}</motion.span>;
}

const logos = ["Northwind", "Verdana", "Atlas", "Olive&Oat", "Lumen", "Kairos"];

export function Stats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const [start, setStart] = useState(false);
  useEffect(() => { if (inView) setStart(true); }, [inView]);

  return (
    <section className="relative py-24 sm:py-32">
      {/* full-width dark band */}
      <div className="absolute inset-0 -z-10 bg-[oklch(0.13_0.012_160)]" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">By the numbers</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Real outcomes for <span className="text-gradient">real brands</span>.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative glass rounded-2xl p-7 text-center overflow-hidden hover:-translate-y-1 transition-transform"
            >
              <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ boxShadow: "inset 0 0 0 1px oklch(0.82 0.19 145 / 0.45)" }} />
              <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-44 rounded-full bg-accent/25 blur-3xl" />

              <div
                className="relative font-display font-bold text-5xl sm:text-6xl text-foreground"
                style={{ textShadow: "0 0 30px oklch(0.82 0.19 145 / 0.55), 0 0 60px oklch(0.62 0.16 150 / 0.35)" }}
              >
                <AnimatedNumber to={s.value} prefix={s.prefix} suffix={s.suffix} start={start} />
              </div>
              <div className="relative mt-3 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* logo strip */}
        <div className="mt-20">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by teams at
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-6 items-center">
            {logos.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group flex items-center justify-center"
              >
                <span className="font-display text-xl font-semibold tracking-tight text-muted-foreground/70 grayscale opacity-60
                                 transition-all duration-300
                                 group-hover:opacity-100 group-hover:grayscale-0 group-hover:text-gradient group-hover:scale-105">
                  {name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
