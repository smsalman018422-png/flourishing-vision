import { Leaf, Send, Briefcase, Camera, Code2 } from "lucide-react";

const cols = [
  {
    title: "Services",
    links: ["SEO & Content", "Paid Media", "Brand Design", "Web Development", "Analytics"],
  },
  {
    title: "Company",
    links: ["About", "Case studies", "Careers", "Press kit"],
  },
  {
    title: "Resources",
    links: ["Blog", "Guides", "Newsletter", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
                <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display font-semibold text-lg">
                LetUs<span className="text-gradient">Grow</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              A digital growth studio helping ambitious brands compound traffic, revenue, and reputation.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[Send, Briefcase, Camera, Code2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center h-9 w-9 rounded-xl glass hover:bg-primary/15 hover:scale-105 transition-all"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LetUsGrow Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
