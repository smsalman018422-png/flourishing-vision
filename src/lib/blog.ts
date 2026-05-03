import { supabase } from "@/integrations/supabase/client";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  readTime: string;
  category: string;
  image: string;
  publishedAt: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
};

type RawPost = Record<string, unknown>;

const truthy = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "published", "visible", "active", "1", "yes"].includes(value.toLowerCase());
  }
  if (typeof value === "number") return value === 1;
  return false;
};

export const isPublished = (post: RawPost) => {
  if (truthy(post.is_published)) return true;
  if (truthy(post.published)) return true;
  if (truthy(post.is_visible)) return true;
  if (typeof post.status === "string" && post.status.toLowerCase() === "published") return true;
  // If no visibility field exists at all, default to visible
  if (
    post.is_published === undefined &&
    post.published === undefined &&
    post.is_visible === undefined &&
    post.status === undefined
  ) {
    return true;
  }
  return false;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

const getImage = (post: RawPost) =>
  str(post.cover_image_url) ||
  str(post.cover_image) ||
  str(post.image_url) ||
  str(post.thumbnail_url) ||
  str(post.featured_image) ||
  "";

export const normalizeBlog = (post: RawPost): BlogPost => ({
  id: str(post.id),
  title: str(post.title),
  slug: str(post.slug),
  excerpt: str(post.excerpt) || str(post.summary),
  content: str(post.content) || str(post.body),
  author: str(post.author_name) || str(post.author),
  authorRole: str(post.author_role),
  authorAvatar: str(post.author_avatar_url) || str(post.author_avatar),
  readTime:
    typeof post.read_time_minutes === "number"
      ? `${post.read_time_minutes} min`
      : str(post.read_time) || str(post.reading_time),
  category: str(post.category),
  image: getImage(post),
  publishedAt: str(post.published_at) || str(post.created_at),
  tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
  metaTitle: str(post.meta_title) || str(post.seo_title) || str(post.title),
  metaDescription:
    str(post.meta_description) ||
    str(post.seo_description) ||
    str(post.excerpt) ||
    str(post.summary),
  isFeatured: Boolean(post.is_featured),
});

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase.from("blog_posts").select("*");
  if (error) throw error;
  const rows = (data ?? []) as RawPost[];
  const visible = rows.filter(isPublished).map(normalizeBlog);
  visible.sort((a, b) => {
    const ad = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bd = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bd - ad;
  });
  return visible;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as RawPost | undefined;
  if (!row || !isPublished(row)) return null;
  return normalizeBlog(row);
}
