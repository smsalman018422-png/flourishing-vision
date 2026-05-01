import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Meet The Growth Team — Let Us Grow" },
      {
        name: "description",
        content:
          "50+ specialists scaling brands globally — creative, paid media, SEO, design, strategy and more.",
      },
      { property: "og:title", content: "Meet The Growth Team — Let Us Grow" },
      { property: "og:description", content: "50+ specialists scaling brands globally." },
    ],
  }),
});
