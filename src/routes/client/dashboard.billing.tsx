import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/client/dashboard/billing")({
  head: () => ({ meta: [{ title: "Billing — Client Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-display font-semibold">Billing</h1>
      <p className="text-muted-foreground">Invoices and payment history coming soon.</p>
    </div>
  ),
});
