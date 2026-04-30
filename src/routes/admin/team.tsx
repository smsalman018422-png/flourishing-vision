import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CrudPage, type FieldDef } from "@/components/admin/CrudPage";

const fields: FieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "role", label: "Role", required: true, placeholder: "Head of Growth" },
  { name: "category", label: "Category", required: true, type: "select", options: ["Leadership", "Strategy", "Creative", "Engineering", "Operations"] },
  { name: "is_founder", label: "Founder", type: "boolean" },
  { name: "bio", label: "Bio", type: "textarea" },
  { name: "photo_url", label: "Photo URL", type: "url" },
  { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { name: "sort_order", label: "Sort order", type: "number" },
];

export const Route = createFileRoute("/admin/team")({
  head: () => ({ meta: [{ title: "Team — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <CrudPage table="team_members" title="Team members" fields={fields} primaryColumn="name" orderBy="sort_order" ascending />
    </AdminShell>
  ),
});
