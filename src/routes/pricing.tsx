import { createFileRoute } from "@tanstack/react-router";
import { getPublicPackages } from "@/functions/packages";

export const Route = createFileRoute("/pricing")({
  validateSearch: (s: Record<string, unknown>): { pkg?: string } => ({
    pkg: typeof s.pkg === "string" && s.pkg.trim() ? s.pkg : undefined,
  }),
  loader: () => getPublicPackages(),
  staleTime: 0,
  shouldReload: true,
  head: () => ({
    meta: [
      { title: "Pricing — Let Us Grow" },
      {
        name: "description",
        content: "Simple, transparent pricing. Pick the plan that matches your stage.",
      },
      { property: "og:title", content: "Pricing — Let Us Grow" },
      {
        property: "og:description",
        content: "Simple, transparent pricing. Pick the plan that matches your stage.",
      },
    ],
  }),
});
