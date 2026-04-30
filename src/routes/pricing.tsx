import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LetUsGrow" },
      {
        name: "description",
        content: "Simple, transparent pricing. Pick the plan that matches your stage.",
      },
      { property: "og:title", content: "Pricing — LetUsGrow" },
      {
        property: "og:description",
        content: "Simple, transparent pricing. Pick the plan that matches your stage.",
      },
    ],
  }),
});
