import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { useEffect, useMemo, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, BookOpen } from "lucide-react";
import { subscribeToTable } from "@/lib/realtime";
import { fetchBlogPosts, type BlogPost } from "@/lib/blog";

const PAGE_SIZE = 6;

export const Route = createLazyFileRoute("/blog")({
  component: BlogPage,
});

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchBlogPosts()
        .then((data) => {
          if (cancelled) return;
          setPosts(data);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Failed to load posts");
          setPosts([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    const unsubscribe = subscribeToTable("blog_posts", load, "public-blog-posts-changes");
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    if (activeCat === "all") return posts;
    return posts.filter((p) => p.category === activeCat);
  }, [posts, activeCat]);

  const featured = filtered.find((p) => p.isFeatured) ?? filtered[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);
  const visible = rest.slice(0, page * PAGE_SIZE);
  const hasMore = rest.length > visible.length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Insights"
        title="Notes from the growth desk"
        subtitle="Tactics, case studies, and lessons from scaling brands across categories."
      />

      {categories.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <LayoutGroup>
            <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 px-4 sm:px-0 min-w-max sm:min-w-0 border-b border-border">
                {categories.map((c) => {
                  const isActive = activeCat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        setActiveCat(c);
                        setPage(1);
                      }}
                      className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[44px] capitalize transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c === "all" ? "All" : c}
                      {isActive && (
                        <motion.span
                          layoutId="blog-underline"
                          className="absolute left-2 right-2 -bottom-px h-0.5 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {loading ? (
          <div className="aspect-[16/9] rounded-3xl glass animate-pulse" />
        ) : error ? (
          <div className="text-center py-24 glass rounded-2xl">
            <p className="text-lg text-muted-foreground">Couldn't load posts. Please try again.</p>
            <p className="mt-2 text-xs text-muted-foreground/70">{error}</p>
          </div>
        ) : !featured ? (
          <div className="text-center py-24 glass rounded-2xl">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="mt-4 text-lg text-muted-foreground">No posts yet — check back soon.</p>
          </div>
        ) : (
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group block rounded-3xl overflow-hidden glass hover:shadow-elegant transition-all"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-video md:aspect-auto bg-muted overflow-hidden">
                {featured.image ? (
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
              </div>
              <div className="p-6 sm:p-10 flex flex-col justify-center">
                <span className="inline-flex w-fit rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium uppercase tracking-wider">
                  Featured
                </span>
                {featured.category && (
                  <span className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                    {featured.category}
                  </span>
                )}
                <h2 className="mt-2 text-2xl sm:text-4xl font-display font-semibold leading-tight">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
                )}
                <PostMeta post={featured} className="mt-5" />
              </div>
            </div>
          </Link>
        )}
      </section>

      {rest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
              >
                <PostCard post={p} />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group block h-full rounded-2xl overflow-hidden glass hover:shadow-elegant transition-all hover:-translate-y-1"
    >
      <div className="aspect-video bg-muted overflow-hidden">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
      </div>
      <div className="p-5">
        {post.category && (
          <span className="text-xs uppercase tracking-wider text-primary font-medium">
            {post.category}
          </span>
        )}
        <h3 className="mt-2 text-lg font-semibold leading-snug line-clamp-2">{post.title}</h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        )}
        <PostMeta post={post} className="mt-4" />
        <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
          Read more <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function PostMeta({ post, className }: { post: BlogPost; className?: string }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className ?? ""}`}
    >
      {post.author && <span className="font-medium text-foreground">{post.author}</span>}
      {date && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date}
        </span>
      )}
      {post.readTime && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.readTime}
        </span>
      )}
    </div>
  );
}
