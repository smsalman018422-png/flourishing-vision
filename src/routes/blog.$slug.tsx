import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — LetUsGrow Blog` },
      { name: "description", content: "A field note from the LetUsGrow team." },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <PageShell>
      <PageHeader eyebrow="Field note" title={title} subtitle="Apr 2026 · 6 min read" />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 prose prose-invert prose-p:text-muted-foreground">
        <p className="text-base sm:text-lg text-muted-foreground">
          This post is a placeholder for "{title}". Real content will be loaded from the CMS as soon as the blog table is wired up.
        </p>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground">
          In the meantime, browse the <Link to="/blog" className="text-primary hover:underline">other field notes</Link> or
          <Link to="/contact" className="text-primary hover:underline"> book a call</Link> if you'd like to talk through the ideas in person.
        </p>
      </article>
    </PageShell>
  );
}
