import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Linkedin as LinkedinIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  category: string;
  is_founder: boolean;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  sort_order: number;
};

const CATEGORIES = [
  "All",
  "Creative Directors",
  "Designers",
  "Content Writers",
  "Social Media",
  "Paid Ads",
  "Account Managers",
  "Analytics",
  "Strategy",
  "QC",
];

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>("All");
  const [selected, setSelected] = useState<TeamMember | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      if (alive) {
        setMembers((data ?? []) as TeamMember[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const founders = useMemo(() => members.filter((m) => m.is_founder), [members]);
  const team = useMemo(() => members.filter((m) => !m.is_founder), [members]);
  const filtered = useMemo(
    () => (active === "All" ? team : team.filter((m) => m.category === active)),
    [team, active]
  );

  return (
    <section id="team" className="relative py-24 md:py-32 bg-background overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary mb-4">
            The People
          </span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Meet The <span className="text-primary">Growth Team</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            50+ specialists ready to scale your brand
          </p>
        </motion.div>

        {/* Founders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {founders.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              onClick={() => setSelected(f)}
              className="group relative cursor-pointer"
            >
              {/* dual border glow */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400/60 via-primary/60 to-amber-400/60 opacity-80 group-hover:opacity-100 blur-sm transition" />
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400 via-primary to-amber-400 opacity-100" />
              <div className="relative rounded-2xl bg-card/90 backdrop-blur-xl p-6 h-full">
                <div className="aspect-square w-full overflow-hidden rounded-xl mb-5 ring-1 ring-border">
                  <img
                    src={f.photo_url ?? ""}
                    alt={f.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{f.name}</h3>
                    <p className="text-sm text-primary font-medium">{f.role}</p>
                  </div>
                  {f.linkedin_url && (
                    <a
                      href={f.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full p-2 bg-primary/10 hover:bg-primary/20 text-primary transition"
                      aria-label={`${f.name} on LinkedIn`}
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{f.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="team-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Team grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {!loading &&
              filtered.map((m) => (
                <motion.button
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelected(m)}
                  className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 text-left hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)] transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 rounded-full bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition" />
                      <img
                        src={m.photo_url ?? ""}
                        alt={m.name}
                        loading="lazy"
                        className="relative h-24 w-24 rounded-full object-cover ring-2 ring-border group-hover:ring-primary transition"
                      />
                    </div>
                    <h4 className="font-semibold">{m.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{m.role}</p>
                    <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {m.category}
                    </span>
                  </div>
                </motion.button>
              ))}
          </AnimatePresence>
        </motion.div>

        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">
            No team members in this category yet.
          </p>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-10 rounded-full p-2 bg-background/60 hover:bg-background border border-border transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="relative aspect-square md:aspect-auto md:h-full">
                  <img
                    src={selected.photo_url ?? ""}
                    alt={selected.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 mb-3">
                    {selected.category}
                  </span>
                  <h3 className="text-2xl font-bold">{selected.name}</h3>
                  <p className="text-primary font-medium">{selected.role}</p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{selected.bio}</p>

                  {selected.skills && selected.skills.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.skills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-3 py-1 rounded-full bg-secondary/60 border border-border"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.linkedin_url && (
                    <a
                      href={selected.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                    >
                      <Linkedin className="h-4 w-4" />
                      View LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
