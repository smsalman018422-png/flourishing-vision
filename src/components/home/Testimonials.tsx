import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const items = [
  {
    q: "LetUsGrow rebuilt our entire acquisition engine in a quarter. We doubled qualified pipeline without doubling spend.",
    a: "Maya Chen",
    r: "VP Marketing, Northwind",
  },
  {
    q: "The most senior team we've ever hired. They operate like a founding marketing function, not an outside agency.",
    a: "Daniel Park",
    r: "CEO, Verdana Skincare",
  },
  {
    q: "Three months in we ranked #1 for our category keyword. Six months in, organic became our largest revenue channel.",
    a: "Priya Natarajan",
    r: "Head of Growth, Atlas",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Trusted by operators</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            Words from the <span className="text-gradient">people we partner with</span>.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.a}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-7 flex flex-col justify-between"
            >
              <Quote className="h-6 w-6 text-accent" />
              <blockquote className="mt-4 text-base leading-relaxed text-foreground/90">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border/60">
                <div className="font-semibold text-sm">{t.a}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
