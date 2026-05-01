import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Let Us Grow" },
      {
        name: "description",
        content: "Our story, mission, values and the team behind every campaign.",
      },
      { property: "og:title", content: "About — Let Us Grow" },
      {
        property: "og:description",
        content: "Our story, mission, values and the team behind every campaign.",
      },
    ],
  }),
});
