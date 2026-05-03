import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type ApproveBody = {
  request_id?: string;
  action?: "approve" | "reject";
  reason?: string;
};

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Missing auth token" };
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: userError?.message ?? "Invalid token" };
  }
  const { data: roleRow } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return { ok: false as const, status: 403, error: "Not authorized" };
  return { ok: true as const, supabaseAdmin };
}

export const Route = createFileRoute("/api/purchase-approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertAdmin(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);
        const sb = admin.supabaseAdmin;

        const body = (await request.json().catch(() => null)) as ApproveBody | null;
        const requestId = body?.request_id;
        const action = body?.action;
        if (!requestId || !action) return json({ ok: false, error: "request_id and action required" }, 400);

        const { data: req, error: reqError } = await sb
          .from("package_purchase_requests")
          .select("*")
          .eq("id", requestId)
          .maybeSingle();
        if (reqError) return json({ ok: false, error: reqError.message }, 500);
        if (!req) return json({ ok: false, error: "Request not found" }, 404);
        if (req.status !== "pending") return json({ ok: false, error: "Already processed" }, 400);

        if (action === "reject") {
          const { error } = await sb
            .from("package_purchase_requests")
            .update({
              status: "rejected",
              rejected_at: new Date().toISOString(),
              notes: body?.reason ? body.reason : req.notes,
            })
            .eq("id", requestId);
          if (error) return json({ ok: false, error: error.message }, 500);

          await sb.from("client_notifications").insert({
            client_id: req.client_id,
            title: "Package request not approved",
            body: body?.reason || "Your recent package request was not approved. Contact support for details.",
            type: "warning",
            link: "/contact",
          });
          return json({ ok: true, status: "rejected" });
        }

        // approve → create membership
        const { data: pkg, error: pkgError } = await sb
          .from("packages")
          .select("id, name, features")
          .eq("id", req.package_id)
          .maybeSingle();
        if (pkgError || !pkg) return json({ ok: false, error: pkgError?.message ?? "Package missing" }, 500);

        const start = new Date();
        const end = new Date(start);
        if (req.billing_cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);

        const { data: newMembership, error: memError } = await sb
          .from("client_memberships")
          .insert({
            client_id: req.client_id,
            package_id: req.package_id,
            plan_id: null,
            status: "active",
            billing_cycle: req.billing_cycle,
            amount: req.amount,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            auto_renew: true,
            is_custom: false,
          })
          .select("id")
          .single();

        if (memError) return json({ ok: false, error: memError.message }, 500);

        // Create invoice + payment records so billing history shows up
        const nowIso = new Date().toISOString();
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        const { data: invoice, error: invError } = await sb
          .from("client_invoices")
          .insert({
            client_id: req.client_id,
            membership_id: newMembership.id,
            invoice_number: invoiceNumber,
            amount: req.amount,
            currency: "USD",
            status: "paid",
            issue_date: nowIso,
            due_date: nowIso,
            paid_date: nowIso,
            notes: `${pkg.name} — ${req.billing_cycle}`,
          })
          .select("id")
          .single();
        if (invError) return json({ ok: false, error: invError.message }, 500);

        const { error: payError } = await sb.from("client_payments").insert({
          client_id: req.client_id,
          invoice_id: invoice.id,
          amount: req.amount,
          currency: "USD",
          method: "card",
          status: "completed",
          payment_date: nowIso,
          reference: invoiceNumber,
          notes: `Payment for ${pkg.name} (${req.billing_cycle})`,
        });
        if (payError) return json({ ok: false, error: payError.message }, 500);

        await sb
          .from("package_purchase_requests")
          .update({
            status: "approved",
            payment_status: "paid",
            approved_at: new Date().toISOString(),
            approved_membership_id: newMembership.id,
          })
          .eq("id", requestId);

        await sb.from("client_notifications").insert({
          client_id: req.client_id,
          title: `Your ${pkg.name} package is active!`,
          body: `Your ${pkg.name} package (${req.billing_cycle}) has been activated. View it in your dashboard.`,
          type: "success",
          link: "/client/dashboard/membership",
        });

        return json({ ok: true, status: "approved", membership_id: newMembership.id });
      },
    },
  },
});
