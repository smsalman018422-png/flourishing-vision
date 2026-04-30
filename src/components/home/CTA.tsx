import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center shadow-glow border border-primary/30"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.46 0.13 152) 0%, oklch(0.62 0.16 150) 50%, oklch(0.82 0.19 145) 100%)",
          }}
        >
          {/* texture */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            }}
          />
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight max-w-3xl mx-auto text-primary-foreground">
              Ready to scale your brand?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-primary-foreground/85 max-w-xl mx-auto">
              Join 500+ brands growing with our team. Free 30-minute strategy call — no pitch deck.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-background text-foreground font-semibold shadow-2xl hover:bg-background/95 transition-colors"
                >
                  Book Free Call <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <Link
                to="/pricing"
                className="inline-flex items-center h-12 px-6 rounded-xl border-2 border-primary-foreground/40 text-primary-foreground font-semibold hover:bg-primary-foreground/10 transition-colors backdrop-blur-sm"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
