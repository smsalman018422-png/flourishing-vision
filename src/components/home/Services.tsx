import { motion } from "framer-motion";
import { Search, Megaphone, PenTool, Code2, BarChart3, Sparkles } from "lucide-react";

const services = [
  { Icon: Search, title: "SEO & Content", desc: "Topical authority, technical SEO, and editorial systems that compound for years." },
  { Icon: Megaphone, title: "Paid Acquisition", desc: "Meta, Google, TikTok, LinkedIn — built around incrementality, not vanity ROAS." },
  { Icon: PenTool, title: "Brand & Design", desc: "Identity systems and creative production that make every channel work harder." },
  { Icon: Code2, title: "Web Engineering", desc: "Lightning-fast marketing sites in Next & TanStack — built for SEO and conversion." },
  { Icon: BarChart3, title: "Analytics & CRO", desc: "Server-side tracking, attribution modeling, and experimentation programs." },
  { Icon: Sparkles, title: "AI Workflows", desc: "Custom GPTs, RAG, and automation that ship measurable operating leverage." },
];

export function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">What we do</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            One team, the entire <span className="text-gradient">growth stack</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            No silos, no handoffs. Strategy, creative, media, and engineering live in one room — yours.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative glass rounded-2xl p-6 overflow-hidden hover:shadow-glow transition-shadow"
            >
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-primary shadow-glow">
                  <s.Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
