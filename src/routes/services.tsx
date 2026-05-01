import { createFileRoute } from "@tanstack/react-router";
import { getPublicServices } from "@/server/services.functions";

export const Route = createFileRoute("/services")({
  loader: () => getPublicServices(),
  head: () => ({
    meta: [
      { title: "Services — Let Us Grow" },
      {
        name: "description",
        content:
          "Social, paid, SEO, branding, design and analytics — engineered to compound revenue.",
      },
      { property: "og:title", content: "Services — Let Us Grow" },
      {
        property: "og:description",
        content: "Six disciplines, one operating system for growth.",
      },
    ],
  }),
});
