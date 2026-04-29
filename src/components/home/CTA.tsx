import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl glass-strong p-10 sm:p-16 text-center shadow-glow"
        >
          <div className="absolute inset-0 bg-hero-radial opacity-80" />
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
              Ready to <span className="text-gradient">grow on purpose</span>?
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              Tell us where you are and where you want to be. We&apos;ll send back a free 30-minute
              audit with three quick wins — no pitch deck.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <motion.a
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                href="mailto:hello@letusgrow.studio"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
              >
                Book your audit <ArrowRight className="h-4 w-4" />
              </motion.a>
              <a
                href="#work"
                className="inline-flex items-center h-12 px-6 rounded-xl glass font-medium hover:bg-muted/50 transition-colors"
              >
                Browse the work
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
