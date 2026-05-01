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

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  author_role: string | null;
  author_avatar_url: string | null;
  category: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
};

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Let Us Grow Blog` },
      {
        name: "description",
        content: "Insights on growth, marketing and brand from the Let Us Grow team.",
      },
      { property: "og:title", content: params.slug },
      { property: "og:description", content: "Insights on growth, marketing and brand." },
    ],
  }),
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
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const postRes = await fetch(`/api/public/blog?slug=${encodeURIComponent(slug)}`);
        if (!postRes.ok) throw new Error("Failed to load post");
        const postBody = (await postRes.json()) as { data?: Post | null };
        if (cancelled) return;
        if (!postBody.data) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setPost(postBody.data);

        const relatedRes = await fetch("/api/public/blog");
        const relatedBody = relatedRes.ok
          ? ((await relatedRes.json()) as { data?: Post[] })
          : { data: [] };
        if (!cancelled) {
          setRelated(
            (relatedBody.data ?? []).filter((item) => item.id !== postBody.data?.id).slice(0, 3),
          );
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-32">
          <div className="h-12 w-2/3 rounded-lg glass animate-pulse" />
          <div className="mt-6 aspect-video rounded-2xl glass animate-pulse" />
        </div>
      </PageShell>
    );
  }

  if (missing || !post) throw notFound();

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
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
      {/* Hero */}
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
          {post.author_name && (
            <span className="font-medium text-foreground">{post.author_name}</span>
          )}
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          )}
          {post.read_time_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.read_time_minutes} min read
            </span>
          )}
        </div>
        {post.cover_image_url && (
          <div className="mt-8 aspect-video rounded-2xl overflow-hidden bg-muted">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-lg mt-10 max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content ?? post.excerpt ?? ""}
          </ReactMarkdown>
        </div>

        {/* Share */}
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

        {/* Author bio */}
        {post.author_name && (
          <div className="mt-12 glass rounded-2xl p-6 flex items-start gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-muted shrink-0">
              {post.author_avatar_url ? (
                <img
                  src={post.author_avatar_url}
                  alt={post.author_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-display text-primary/60">
                  {post.author_name.slice(0, 1)}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{post.author_name}</p>
              {post.author_role && (
                <p className="text-sm text-muted-foreground">{post.author_role}</p>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Related */}
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
                  {r.cover_image_url ? (
                    <img
                      src={r.cover_image_url}
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

      {/* Newsletter CTA */}
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
