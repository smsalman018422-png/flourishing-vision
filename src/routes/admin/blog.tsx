import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CrudPage, type FieldDef } from "@/components/admin/CrudPage";

const fields: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "slug", label: "Slug", required: true, placeholder: "compounding-growth" },
  { name: "excerpt", label: "Excerpt", type: "textarea" },
  { name: "content", label: "Content (markdown)", type: "textarea" },
  { name: "cover_image_url", label: "Cover image URL", type: "url" },
  { name: "author_name", label: "Author" },
  { name: "published", label: "Published", type: "boolean" },
];

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <CrudPage table="blog_posts" title="Blog posts" fields={fields} primaryColumn="title" />
    </AdminShell>
  ),
});
