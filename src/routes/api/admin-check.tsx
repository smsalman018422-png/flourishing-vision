import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/admin-auth";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/admin-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);
        return json({ ok: true });
      },
    },
  },
});