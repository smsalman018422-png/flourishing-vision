import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Portfolio } from "@/components/home/Portfolio";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — LetUsGrow" },
      { name: "description", content: "Selected work for ambitious brands across DTC, SaaS, and services." },
      { property: "og:title", content: "Portfolio — LetUsGrow" },
      { property: "og:description", content: "Real campaigns, real revenue. See the work." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Selected work"
        title="Outcomes we're proud to put our name on"
        subtitle="A snapshot of recent engagements. Click any project for the full story."
      />
      <Portfolio />
    </PageShell>
  );
}
