import { createFileRoute } from "@tanstack/react-router";
import { assertStaffAccess } from "@/lib/admin-api-auth.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type AssignBody = {
  client_id?: string;
  // Either an existing package
  package_id?: string;
  // ...or a fully custom one
  custom_name?: string;
  custom_features?: string[];
  // Common
  billing_cycle?: "monthly" | "yearly";
  amount?: number;
  duration_days?: number; // optional override
  start_date?: string;
};

export const Route = createFileRoute("/api/assign-package")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertStaffAccess(request, ["super_admin", "admin", "manager"]);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);
        const sb = admin.supabase;

        const body = (await request.json().catch(() => null)) as AssignBody | null;
        if (!body?.client_id) return json({ ok: false, error: "client_id required" }, 400);
        const billingCycle = body.billing_cycle === "yearly" ? "yearly" : "monthly";

        let pkgName = body.custom_name?.trim() || "Custom Package";
        let pkgId: string | null = null;
        let isCustom = true;
        let amount = Number(body.amount) || 0;
        let customFeatures: string[] = Array.isArray(body.custom_features)
          ? body.custom_features.filter(Boolean)
          : [];

        if (body.package_id) {
          const { data: pkg, error } = await sb
            .from("packages")
            .select("id, name, price_monthly, price_yearly")
            .eq("id", body.package_id)
            .maybeSingle();
          if (error) return json({ ok: false, error: error.message }, 500);
          if (!pkg) return json({ ok: false, error: "Package not found" }, 404);
          pkgId = pkg.id;
          pkgName = pkg.name;
          isCustom = false;
          if (!body.amount) {
            amount = billingCycle === "yearly" ? pkg.price_yearly : pkg.price_monthly;
          }
        }

        const start = body.start_date ? new Date(body.start_date) : new Date();
        const end = new Date(start);
        if (body.duration_days && body.duration_days > 0) {
          end.setDate(end.getDate() + body.duration_days);
        } else if (billingCycle === "yearly") {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }

        const { data: inserted, error: insertError } = await sb
          .from("client_memberships")
          .insert({
            client_id: body.client_id,
            package_id: pkgId,
            plan_id: null,
            status: "active",
            billing_cycle: billingCycle,
            amount,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            auto_renew: false,
            is_custom: isCustom,
            custom_name: isCustom ? pkgName : null,
            custom_features: isCustom ? customFeatures : [],
          })
          .select("id")
          .single();

        if (insertError) return json({ ok: false, error: insertError.message }, 500);

        await sb.from("client_notifications").insert({
          client_id: body.client_id,
          title: `Your ${pkgName} package is active!`,
          body: `An admin has activated ${pkgName} for your account. View it in your dashboard.`,
          type: "success",
          link: "/client/dashboard/membership",
        });

        return json({ ok: true, membership_id: inserted.id });
      },
    },
  },
});
