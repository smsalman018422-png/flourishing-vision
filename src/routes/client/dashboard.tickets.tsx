import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/client/dashboard/tickets")({
  head: () => ({ meta: [{ title: "Support — Client Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-display font-semibold">Support Tickets</h1>
      <p className="text-muted-foreground">Open and manage support tickets here. Coming soon.</p>
    </div>
  ),
});
