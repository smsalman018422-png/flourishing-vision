import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Let Us Grow" },
      { name: "description", content: "Tactics, case studies, and lessons from scaling brands." },
      { property: "og:title", content: "Blog — Let Us Grow" },
      {
        property: "og:description",
        content: "Tactics, case studies, and lessons from scaling brands.",
      },
    ],
  }),
});
