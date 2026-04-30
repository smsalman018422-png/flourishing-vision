import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <PageTitle title="Services" />
      <Card>
        <p className="text-sm text-muted-foreground">
          Public services and per-service detail copy live in code at{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground">src/routes/services.tsx</code> and{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground">src/routes/services.$slug.tsx</code>.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Move these to a database-backed table whenever you want non-developers to edit them — say the word and we'll add a <code>services</code> table with the same CRUD UI as the other resources.
        </p>
      </Card>
    </AdminShell>
  ),
});
