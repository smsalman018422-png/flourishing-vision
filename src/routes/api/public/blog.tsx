import { createFileRoute } from "@tanstack/react-router";

const LIST_COLUMNS = [
  "id",
  "slug",
  "title",
  "excerpt",
  "cover_image_url",
  "author_name",
  "author_avatar_url",
  "category",
  "read_time_minutes",
  "published_at",
  "is_featured",
] as const;

const DETAIL_COLUMNS = [...LIST_COLUMNS, "content", "author_role"] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

type SqlClient = {
  (...args: unknown[]): unknown;
  end: (options?: { timeout?: number }) => Promise<void>;
};

async function withDirectDb<T>(run: (sql: SqlClient) => Promise<T>) {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) throw new Error("Database connection is not configured");

  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 1,
    connect_timeout: 10,
    prepare: false,
  }) as unknown as SqlClient;

  try {
    return await run(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export const Route = createFileRoute("/api/public/blog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug")?.trim();

        try {
          const data = await withDirectDb<unknown[]>(async (sql) => {
            if (slug) {
              return sql`
                select ${sql(DETAIL_COLUMNS)}
                from public.blog_posts
                where published = true and slug = ${slug}
                limit 1
              ` as unknown[];
            }

            return sql`
              select ${sql(LIST_COLUMNS)}
              from public.blog_posts
              where published = true
              order by published_at desc nulls last, created_at desc
              limit 100
            ` as unknown[];
          });

          if (slug) return json({ ok: true, data: data[0] ?? null });
          return json({ ok: true, data });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load blog posts";
          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
