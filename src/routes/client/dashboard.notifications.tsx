import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/client/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Client Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-display font-semibold">Notifications</h1>
      <p className="text-muted-foreground">Your notifications will appear here.</p>
    </div>
  ),
});
