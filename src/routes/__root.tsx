import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, ScriptOnce } from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { MetaPixel } from "@/components/MetaPixel";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl sm:text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0a0f0d" },
      { title: "Let Us Grow — Digital growth studio" },
      { name: "description", content: "A senior team building SEO, paid, content, and engineering systems that compound revenue for ambitious brands." },
      { name: "author", content: "Let Us Grow" },
      { property: "og:title", content: "Let Us Grow — Digital growth studio" },
      { property: "og:description", content: "Performance marketing made compounding. SEO, paid, brand, and engineering under one roof." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Let Us Grow" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Let Us Grow — Digital growth studio" },
      { name: "twitter:description", content: "Performance marketing made compounding." },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://yqrtqeklcinuxgogfilv.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://yqrtqeklcinuxgogfilv.supabase.co" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ScriptOnce children={THEME_INIT_SCRIPT} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
