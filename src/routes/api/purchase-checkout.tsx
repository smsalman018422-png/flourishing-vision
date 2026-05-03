import { createFileRoute } from "@tanstack/react-router";

/**
 * Creates a purchase request for a package.
 *
 * STRIPE-READY: Today this just inserts a `package_purchase_requests` row in
 * 'pending' state and returns a redirect URL pointing back to the dashboard.
 * To wire up real Stripe later:
 *   1. Add STRIPE_SECRET_KEY secret + per-package stripe_price_id_monthly/yearly columns.
 *   2. Inside the marked block below, call Stripe's
 *      `checkout.sessions.create({ mode: 'subscription', line_items, success_url, cancel_url, client_reference_id, metadata: { request_id } })`
 *      and return `{ url: session.url, session_id: session.id }` instead of the placeholder.
 *   3. Add a webhook at /api/public/stripe-webhook that flips payment_status='paid'
 *      on `checkout.session.completed`.
 * The pricing-page client only needs `{ ok, redirect_url }` — no client changes
 * required when you swap implementations.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type CheckoutRequest = {
  package_id?: string;
  billing_cycle?: "monthly" | "yearly";
  paypal_order_id?: string;
  payer_email?: string;
};

export const Route = createFileRoute("/api/purchase-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return json({ ok: false, error: "Sign in required" }, 401);
        }
        const token = authHeader.replace("Bearer ", "").trim();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
          return json({ ok: false, error: "Invalid session" }, 401);
        }
        const userId = userData.user.id;

        const body = (await request.json().catch(() => null)) as CheckoutRequest | null;
        const packageId = body?.package_id;
        const billingCycle = body?.billing_cycle === "yearly" ? "yearly" : "monthly";
        if (!packageId) return json({ ok: false, error: "package_id required" }, 400);

        const { data: pkg, error: pkgError } = await supabaseAdmin
          .from("packages")
          .select("id, name, price_monthly, price_yearly, is_visible")
          .eq("id", packageId)
          .maybeSingle();

        if (pkgError) return json({ ok: false, error: pkgError.message }, 500);
        if (!pkg || !pkg.is_visible) return json({ ok: false, error: "Package not available" }, 404);

        const amount =
          billingCycle === "yearly" ? pkg.price_yearly || 0 : pkg.price_monthly || 0;

        const paypalOrderId = body?.paypal_order_id?.trim();
        const payerEmail = body?.payer_email?.trim();
        const paid = !!paypalOrderId;

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("package_purchase_requests")
          .insert({
            client_id: userId,
            package_id: packageId,
            billing_cycle: billingCycle,
            amount,
            status: "pending",
            payment_status: paid ? "paid" : "unpaid",
            stripe_session_id: paypalOrderId ?? null,
            notes: paid
              ? `PayPal order ${paypalOrderId}${payerEmail ? ` · ${payerEmail}` : ""}`
              : "Awaiting payment integration. Created via placeholder checkout.",
          })
          .select("id")
          .single();

        if (insertError) return json({ ok: false, error: insertError.message }, 500);

        if (paid) {
          await supabaseAdmin.from("client_payments").insert({
            client_id: userId,
            amount,
            currency: "USD",
            method: "paypal",
            status: "completed",
            reference: paypalOrderId,
            notes: `PayPal payment for ${pkg.name}${payerEmail ? ` · payer ${payerEmail}` : ""}`,
          });

          await supabaseAdmin.from("client_notifications").insert({
            client_id: userId,
            title: "Payment received",
            body: `We received your $${amount} payment for ${pkg.name}. Your package will be activated within 24 hours.`,
            type: "success",
            link: "/client/dashboard/packages",
          });
        }

        const { data: admins } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        if (admins?.length) {
          await supabaseAdmin.from("client_notifications").insert(
            admins.map((a: { user_id: string }) => ({
              client_id: a.user_id,
              title: paid ? "New PAID package request" : "New package purchase request",
              body: `A client requested ${pkg.name} (${billingCycle})${paid ? ` — paid via PayPal (${paypalOrderId})` : ""}. Review in Packages → Pending.`,
              type: "info",
              link: "/admin/packages",
            })),
          );
        }

        return json({
          ok: true,
          mode: "pending_approval",
          request_id: inserted.id,
          redirect_url: "/client/dashboard/packages?purchase=pending",
        });
      },
    },
  },
});
