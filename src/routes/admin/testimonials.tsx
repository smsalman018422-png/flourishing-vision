import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CrudPage, type FieldDef } from "@/components/admin/CrudPage";

const fields: FieldDef[] = [
  { name: "author_name", label: "Author", required: true },
  { name: "author_role", label: "Role", required: true },
  { name: "company", label: "Company", required: true },
  { name: "quote", label: "Quote", type: "textarea", required: true },
  { name: "rating", label: "Rating (1-5)", type: "number" },
  { name: "photo_url", label: "Photo URL", type: "url" },
  { name: "video_url", label: "Video URL", type: "url" },
  { name: "video_thumbnail_url", label: "Video thumbnail URL", type: "url" },
  { name: "sort_order", label: "Sort order", type: "number" },
];

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <CrudPage table="testimonials" title="Testimonials" fields={fields} primaryColumn="author_name" orderBy="sort_order" ascending />
    </AdminShell>
  ),
});
