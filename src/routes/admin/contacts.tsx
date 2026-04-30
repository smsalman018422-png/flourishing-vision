import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, PageTitle, Button } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Submission = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  message: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminShell>
      <ContactsPage />
    </AdminShell>
  ),
});

function ContactsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setItems((data ?? []) as Submission[]);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <>
      <PageTitle title="Contact submissions" />
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No submissions yet.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setOpen(open === s.id ? null : s.id)} className="text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium truncate">{s.full_name}</span>
                      <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[s.company, s.service, s.budget].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`mailto:${s.email}`} className="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40">
                      <Mail className="h-4 w-4" />
                    </a>
                    <Button variant="danger" onClick={() => remove(s.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {open === s.id && s.message && (
                  <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap glass rounded-xl p-3">{s.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
