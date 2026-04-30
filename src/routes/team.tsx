import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Team } from "@/components/home/Team";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — LetUsGrow" },
      { name: "description", content: "Meet the senior operators behind every LetUsGrow engagement." },
      { property: "og:title", content: "Team — LetUsGrow" },
      { property: "og:description", content: "Senior strategists, builders and creatives." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="The people" title="A senior team, no juniors hiding behind a deck" subtitle="Operators, strategists, and builders who have shipped the work themselves." />
      <Team />
    </PageShell>
  );
}
