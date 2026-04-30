import { createFileRoute } from "@tanstack/react-router";

const LIST_COLUMNS =
  "id,slug,title,excerpt,cover_image_url,author_name,author_avatar_url,category,read_time_minutes,published_at,is_featured";

const DETAIL_COLUMNS = LIST_COLUMNS + ",content,author_role";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export const Route = createFileRoute("/api/public/blog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug")?.trim();

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (slug) {
            const { data, error } = await supabaseAdmin
              .from("blog_posts")
              .select(DETAIL_COLUMNS)
              .eq("published", true)
              .eq("slug", slug)
              .limit(1);
            if (error) return json({ ok: false, error: error.message }, 500);
            return json({ ok: true, data: data?.[0] ?? null });
          }

          const { data, error } = await supabaseAdmin
            .from("blog_posts")
            .select(LIST_COLUMNS)
            .eq("published", true)
            .order("published_at", { ascending: false, nullsFirst: false })
            .limit(100);
          if (error) return json({ ok: false, error: error.message }, 500);
          return json({ ok: true, data: data ?? [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load blog posts";
          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
