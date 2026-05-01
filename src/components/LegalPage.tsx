import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Loader2 } from "lucide-react";

export function LegalPage({
  settingKey,
  title,
  subtitle,
  fallback,
}: {
  settingKey: string;
  title: string;
  subtitle: string;
  fallback: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const v = (data?.value as { v?: string } | null)?.v?.trim();
        setContent(v && v.length > 0 ? v : fallback);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settingKey, fallback]);

  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title={title} subtitle={subtitle} />
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-24">
        {loading ? (
          <div className="py-16 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <article className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
            {content}
          </article>
        )}
        <p className="mt-12 text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </section>
    </PageShell>
  );
}
