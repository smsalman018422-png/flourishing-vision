import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { type ComponentType, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, Link as LinkIcon } from "lucide-react";
import { TwitterIcon, LinkedInIcon, FacebookIcon } from "@/components/icons/Brands";
import { fetchBlogPostBySlug, fetchBlogPosts, type BlogPost } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchBlogPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  staleTime: 0,
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    const title = post?.metaTitle || params.slug;
    const desc =
      post?.metaDescription || "Insights on growth, marketing and brand from Let Us Grow.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
    ];
    if (post?.image) {
      meta.push({ property: "og:image", content: post.image });
      meta.push({ name: "twitter:image", content: post.image });
    }
    return { meta };
  },
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-display font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Button asChild className="mt-6">
          <Link to="/blog">Back to blog</Link>
        </Button>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-3xl font-display font-semibold">Post not found</h1>
        <Button asChild className="mt-6">
          <Link to="/blog">Back to blog</Link>
        </Button>
      </div>
    </PageShell>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts()
      .then((all) => {
        if (cancelled) return;
        setRelated(all.filter((r) => r.id !== post.id).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(url);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setSubscribing(false);
    if (error) {
      toast.error("Couldn't subscribe — already on the list?");
      return;
    }
    toast.success("Subscribed — welcome aboard.");
    setEmail("");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-4 pb-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        {post.category && (
          <span className="text-xs uppercase tracking-wider text-primary font-medium">
            {post.category}
          </span>
        )}
        <h1 className="mt-3 text-3xl sm:text-5xl font-display font-semibold leading-tight">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {post.author && <span className="font-medium text-foreground">{post.author}</span>}
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          )}
          {post.readTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          )}
        </div>
        {post.image && (
          <div className="mt-8 aspect-video rounded-2xl overflow-hidden bg-muted">
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="prose prose-invert prose-lg mt-10 max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || post.excerpt || ""}
          </ReactMarkdown>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full glass px-3 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-8">
          <span className="text-sm text-muted-foreground mr-2">Share:</span>
          <ShareBtn
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            icon={TwitterIcon}
            label="Twitter"
          />
          <ShareBtn
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            icon={LinkedInIcon}
            label="LinkedIn"
          />
          <ShareBtn
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            icon={FacebookIcon}
            label="Facebook"
          />
          <button
            onClick={copyLink}
            className="h-10 inline-flex items-center gap-2 rounded-full glass px-4 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <LinkIcon className="h-4 w-4" /> Copy link
          </button>
        </div>

        {post.author && (
          <div className="mt-12 glass rounded-2xl p-6 flex items-start gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-muted shrink-0">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-display text-primary/60">
                  {post.author.slice(0, 1)}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{post.author}</p>
              {post.authorRole && (
                <p className="text-sm text-muted-foreground">{post.authorRole}</p>
              )}
            </div>
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Keep reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group block rounded-2xl overflow-hidden glass hover:shadow-elegant transition-all hover:-translate-y-1"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                <div className="p-5">
                  {r.category && (
                    <span className="text-xs uppercase tracking-wider text-primary">
                      {r.category}
                    </span>
                  )}
                  <h3 className="mt-2 font-semibold line-clamp-2">{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 sm:p-16 text-center text-primary-foreground">
          <h2 className="text-2xl sm:text-4xl font-display font-semibold">
            Get the next one in your inbox
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            One growth essay a week. No fluff. Unsubscribe anytime.
          </p>
          <form
            onSubmit={subscribe}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              required
              maxLength={255}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/90 text-foreground"
            />
            <Button type="submit" variant="secondary" disabled={subscribing}>
              {subscribing ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function ShareBtn({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="h-10 w-10 inline-flex items-center justify-center rounded-full glass hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
