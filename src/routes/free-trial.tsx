import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/free-trial")({
  head: () => ({
    meta: [
      { title: "Start Your 7-Day Free Trial — Let Us Grow" },
      {
        name: "description",
        content:
          "Try our premium social media growth, content strategy, and performance marketing free for 7 days. No credit card required.",
      },
      { property: "og:title", content: "Start Your 7-Day Free Trial — Let Us Grow" },
      {
        property: "og:description",
        content:
          "Scale your brand risk-free. Real strategy, premium creatives, zero credit card. 100+ brands trust us.",
      },
    ],
  }),
});
