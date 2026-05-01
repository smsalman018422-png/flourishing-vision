import { createFileRoute } from "@tanstack/react-router";
import { getPublicPackages } from "@/server/packages.functions";

export const Route = createFileRoute("/pricing")({
  loader: () => getPublicPackages(),
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
