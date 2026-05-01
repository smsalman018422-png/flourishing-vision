import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/client/dashboard/membership")({
  head: () => ({ meta: [{ title: "Membership — Client Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-display font-semibold">Membership</h1>
      <p className="text-muted-foreground">Plan details and renewal options coming soon.</p>
    </div>
  ),
});
