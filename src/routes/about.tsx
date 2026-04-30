import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Stats } from "@/components/home/Stats";
import { Process } from "@/components/home/Process";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — LetUsGrow" },
      { name: "description", content: "Why LetUsGrow exists, how we work, and who we work with." },
      { property: "og:title", content: "About — LetUsGrow" },
      { property: "og:description", content: "A growth studio built around senior operators." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About"
        title="We grow brands the way we'd grow our own"
        subtitle="Founded in 2025 across four offices, LetUsGrow exists because most agencies sell hours. We sell outcomes — and stay close enough to the work to be accountable for them."
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-display font-semibold">Our mission</h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            Take ambitious brands from "we should be doing more" to a calm, compounding growth engine — without bloating them with overhead.
          </p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-display font-semibold">How we work</h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            Senior operators only. Tight pods. Weekly insight memos. Quarterly bets sized to the runway, not the retainer.
          </p>
        </div>
      </section>
      <Stats />
      <Process />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-center">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
        >
          Work with us →
        </Link>
      </section>
    </PageShell>
  );
}
