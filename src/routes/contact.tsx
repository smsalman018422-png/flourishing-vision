import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Contact } from "@/components/home/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — LetUsGrow" },
      { name: "description", content: "Book a free 30-minute strategy call or send us a brief." },
      { property: "og:title", content: "Contact — LetUsGrow" },
      { property: "og:description", content: "We reply within 2 hours, business days." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="Get in touch" title="Let's talk about what you want to grow" subtitle="Book a free 30-minute strategy call, or drop us a brief — we reply within 2 hours." />
      <Contact />
    </PageShell>
  );
}
