import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-radial" />
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Performance marketing, made compounding</span>
          </div>

          <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight">
            Grow what matters.{" "}
            <span className="text-gradient">Skip the noise.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re a senior team of strategists, designers, and engineers who turn brands into
            category leaders — through SEO, paid, content, and conversion engineering.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <motion.a
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              href="#contact"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
            >
              Book a growth audit
              <ArrowRight className="h-4 w-4" />
            </motion.a>
            <a
              href="#work"
              className="inline-flex items-center h-12 px-6 rounded-xl glass font-medium hover:bg-muted/50 transition-colors"
            >
              See case studies
            </a>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            { k: "+312%", l: "avg. organic growth", Icon: TrendingUp },
            { k: "180+", l: "brands scaled", Icon: Users },
            { k: "$48M", l: "tracked revenue", Icon: Sparkles },
            { k: "4.9/5", l: "client rating", Icon: Sparkles },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="glass rounded-2xl p-5 hover:-translate-y-1 transition-transform"
            >
              <s.Icon className="h-4 w-4 text-accent" />
              <div className="mt-3 text-2xl sm:text-3xl font-display font-semibold">{s.k}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
