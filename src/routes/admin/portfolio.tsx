import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CrudPage, type FieldDef } from "@/components/admin/CrudPage";

const fields: FieldDef[] = [
  { name: "project_title", label: "Project title", required: true },
  { name: "client_name", label: "Client name", required: true },
  { name: "category", label: "Category", required: true, placeholder: "DTC, SaaS, Services…" },
  { name: "cover_image_url", label: "Cover image URL", type: "url" },
  { name: "challenge", label: "Challenge", type: "textarea" },
  { name: "solution", label: "Solution", type: "textarea" },
  { name: "results", label: "Results", type: "textarea" },
  { name: "roi_pct", label: "ROI %", type: "number" },
  { name: "growth_pct", label: "Growth %", type: "number" },
  { name: "revenue_label", label: "Revenue label", placeholder: "$1.2M ARR" },
  { name: "testimonial_quote", label: "Testimonial quote", type: "textarea" },
  { name: "testimonial_author", label: "Testimonial author" },
  { name: "testimonial_role", label: "Testimonial role" },
  { name: "sort_order", label: "Sort order", type: "number" },
];

export const Route = createFileRoute("/admin/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <CrudPage table="portfolio" title="Portfolio" fields={fields} primaryColumn="project_title" orderBy="sort_order" ascending />
    </AdminShell>
  ),
});
