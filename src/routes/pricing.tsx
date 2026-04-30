import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Pricing } from "@/components/home/Pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LetUsGrow" },
      { name: "description", content: "Transparent monthly packages — Starter, Growth, and Enterprise." },
      { property: "og:title", content: "Pricing — LetUsGrow" },
      { property: "og:description", content: "Three tiers, no surprises. 30-day satisfaction guarantee." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="Pricing" title="Simple packages. Senior teams. Real outcomes." subtitle="Start where you are. Scale when the numbers say so." />
      <Pricing />
    </PageShell>
  );
}
