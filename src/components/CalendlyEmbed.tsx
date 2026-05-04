import { InlineWidget, PopupButton } from "react-calendly";
import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

export function CalendlyInline({ className, height = 700 }: { className?: string; height?: number }) {
  const { data: settings, isLoading } = useSiteSettings();
  const url = settings?.calendly_url?.trim();

  if (isLoading) return <Skeleton className={className ?? "w-full"} style={{ height }} />;
  if (!url) {
    return (
      <div
        className={className ?? "w-full grid place-items-center rounded-2xl border border-border/60 bg-card/40 text-sm text-muted-foreground"}
        style={{ height }}
      >
        Booking unavailable — please contact us directly.
      </div>
    );
  }

  return <InlineWidget url={url} styles={{ height: `${height}px` }} />;
}

export function BookMeetingButton({
  text = "Book a Meeting",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const { data: settings, isLoading } = useSiteSettings();
  const url = settings?.calendly_url?.trim();
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRootEl(document.body);
  }, []);

  const baseCls =
    className ??
    "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30";

  if (isLoading) {
    return (
      <button disabled className={`${baseCls} opacity-60 cursor-wait`}>
        <Calendar className="h-4 w-4" /> Loading…
      </button>
    );
  }

  if (!url || !rootEl) {
    return (
      <button disabled className={`${baseCls} opacity-50 cursor-not-allowed`}>
        <Calendar className="h-4 w-4" /> Booking unavailable
      </button>
    );
  }

  return <PopupButton url={url} rootElement={rootEl} text={text} className={baseCls} />;
}
