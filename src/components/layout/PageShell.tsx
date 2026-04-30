import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-x-hidden">
      <Navbar />
      <main className="pt-24">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-12 sm:pt-16 sm:pb-20">
      <div aria-hidden className="absolute inset-x-0 -top-20 h-64 bg-hero-radial pointer-events-none" />
      <div className="relative max-w-3xl">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
