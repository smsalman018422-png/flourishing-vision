import { createFileRoute } from "@tanstack/react-router";
import { assertStaffAccess } from "@/lib/admin-api-auth.server";

const ALLOWED_BUCKETS = new Set([
  "team-photos",
  "portfolio-images",
  "blog-covers",
  "blog-images",
  "service-images",
  "testimonial-photos",
  "testimonial-images",
]);
const SAFE_FOLDER = /^[a-zA-Z0-9/_-]{0,120}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/admin-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertStaffAccess(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        const bucket = String(form?.get("bucket") ?? "");
        const folder = String(form?.get("folder") ?? "").replace(/^\/+|\/+$/g, "");

        if (!ALLOWED_BUCKETS.has(bucket)) return json({ ok: false, error: "Unsupported image bucket" }, 400);
        if (!SAFE_FOLDER.test(folder)) return json({ ok: false, error: "Invalid upload folder" }, 400);
        if (!(file instanceof File)) return json({ ok: false, error: "Missing image file" }, 400);
        if (!file.type.startsWith("image/")) return json({ ok: false, error: "Only image files are supported" }, 400);
        if (file.size > 8 * 1024 * 1024) return json({ ok: false, error: "Max image size is 8 MB" }, 400);

        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${folder ? folder + "/" : ""}${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error } = await admin.supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (error) return json({ ok: false, error: error.message }, 500);

        const { data } = admin.supabase.storage.from(bucket).getPublicUrl(path);
        return json({ ok: true, url: data.publicUrl });
      },
    },
  },
});