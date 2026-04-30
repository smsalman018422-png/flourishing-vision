import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { subscribeToTable } from "@/lib/realtime";

type Member = {
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

const FILTERS = [
  { key: "all", label: "All", value: null },
  { key: "creative", label: "Creative", value: "creative" },
  { key: "designers", label: "Designers", value: "designers" },
  { key: "writers", label: "Writers", value: "writers" },
  { key: "social", label: "Social Media", value: "social-media" },
  { key: "ads", label: "Paid Ads", value: "paid-ads" },
  { key: "account", label: "Account Mgmt", value: "account-management" },
  { key: "analytics", label: "Analytics", value: "analytics" },
  { key: "strategy", label: "Strategy", value: "strategy" },
  { key: "qc", label: "QC", value: "qc" },
];

export const Route = createLazyFileRoute("/team")({
  component: TeamPage,
});

function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadMembers = () => supabase
      .from("team_members")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setMembers((data ?? []) as Member[]);
        setLoading(false);
      });
    loadMembers();
    const unsubscribe = subscribeToTable("team_members", loadMembers, "public-team-members-changes");
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const founders = useMemo(() => members.filter((m) => m.is_founder), [members]);
  const team = useMemo(() => members.filter((m) => !m.is_founder), [members]);
  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === activeFilter);
    if (!f || !f.value) return team;
    return team.filter((m) => (m.category ?? "").toLowerCase() === f.value);
  }, [team, activeFilter]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="The team"
        title="Meet The Growth Team"
        subtitle="50+ specialists scaling brands globally."
      />

      {/* Founders */}
      {founders.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-6">Founders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {founders.map((m, i) => (
              <FounderCard key={m.id} member={m} index={i} onOpen={() => setSelected(m)} />
            ))}
          </div>
        </section>
      )}

      {/* Filter bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <LayoutGroup>
          <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-4 sm:px-0 min-w-max sm:min-w-0 border-b border-border">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                    {isActive && (
                      <motion.span
                        layoutId="team-filter-underline"
                        className="absolute left-2 right-2 -bottom-px h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Team grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl glass animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl">
            <p className="text-lg text-muted-foreground">No team members in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <MemberCard member={m} onOpen={() => setSelected(m)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 sm:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold">Want to join us?</h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
            We're always looking for sharp, kind operators. Tell us what you do best.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/contact">
              Careers <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MemberDialog member={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

function FounderCard({
  member,
  index,
  onOpen,
}: {
  member: Member;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative text-left rounded-3xl p-[2px] bg-gradient-to-br from-primary via-amber-400 to-primary transition-transform hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="rounded-[calc(1.5rem-2px)] glass-strong p-6 h-full">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-5 relative">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-amber-300/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary/50" />
            </div>
          )}
        </div>
        <p className="text-xs uppercase tracking-wider text-primary font-medium">Co-Founder</p>
        <h3 className="mt-1 text-2xl font-display font-semibold">{member.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
        {member.bio && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
        )}
        {member.linkedin_url && (
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px]"
          >
            <ExternalLink className="h-4 w-4" /> Connect
          </a>
        )}
      </div>
    </motion.button>
  );
}

function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full text-left rounded-2xl glass p-5 transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="mx-auto h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary transition-all">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl font-display text-primary/60">
            {member.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-base font-semibold truncate">{member.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.role}</p>
        <span className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
          {(member.category ?? "team").replace(/-/g, " ")}
        </span>
      </div>
    </button>
  );
}

function MemberDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {member && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-muted shrink-0 ring-2 ring-primary">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl font-display text-primary/60">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-display">{member.name}</DialogTitle>
                  <DialogDescription className="text-sm">{member.role}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {member.bio && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {member.bio}
              </p>
            )}
            {member.skills && member.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {member.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {member.linkedin_url && (
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px]"
              >
                <ExternalLink className="h-4 w-4" /> View LinkedIn
              </a>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
