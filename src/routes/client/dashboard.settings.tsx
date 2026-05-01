import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/client/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Client Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-display font-semibold">Settings</h1>
      <p className="text-muted-foreground">Profile and preferences coming soon.</p>
    </div>
  ),
});
