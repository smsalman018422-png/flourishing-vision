import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, Loader2, Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const services = ["Social Media", "Paid Ads", "SEO", "Branding", "Design", "Analytics"];
const company = ["About", "Team", "Portfolio", "Blog", "Careers", "Contact"];

type IconProps = { className?: string };
const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const LinkedinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const TwitterIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const YoutubeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const socials = [
  { Icon: InstagramIcon, label: "Instagram", href: "#" },
  { Icon: LinkedinIcon, label: "LinkedIn", href: "#" },
  { Icon: TwitterIcon, label: "Twitter", href: "#" },
  { Icon: FacebookIcon, label: "Facebook", href: "#" },
  { Icon: YoutubeIcon, label: "YouTube", href: "#" },
];

const emailSchema = z.string().trim().email({ message: "Enter a valid email" }).max(255);

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setStatus("loading");
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data });
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already subscribed 🌱");
        setStatus("success");
      } else {
        toast.error("Couldn't subscribe. Try again.");
        setStatus("idle");
      }
      return;
    }
    setStatus("success");
    setEmail("");
    toast.success("Subscribed! Growth tips inbound 🌱");
  };

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border/60 bg-[oklch(0.12_0.012_160)] text-foreground">
      {/* green grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.62 0.16 150 / 0.18) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.62 0.16 150 / 0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      {/* glow accents */}
      <div aria-hidden className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 text-center md:text-left md:grid-cols-2 lg:grid-cols-4">
          {/* COL 1 — Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
                <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display font-semibold text-lg">
                LetU<span className="text-gradient">Grow</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Growing brands globally since 2025.
            </p>
            <div className="mt-6 flex items-center justify-center md:justify-start gap-2">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center h-9 w-9 rounded-xl glass hover:bg-primary/20 hover:scale-105 hover:text-primary transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* COL 2 — Services */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Services
            </h4>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s}>
                  <a href="#" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 3 — Company */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Company
            </h4>
            <ul className="mt-4 space-y-2.5">
              {company.map((c) => (
                <li key={c}>
                  <a href="#" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                    {c}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/client/login" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Client Login
                </Link>
              </li>
              <li>
                <Link to="/client/signup" className="text-sm text-foreground/80 hover:text-primary transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 4 — Newsletter */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Newsletter
            </h4>
            <p className="mt-4 text-sm text-foreground/80">Get growth tips weekly.</p>
            <form onSubmit={handleSubscribe} className="mt-4 space-y-2">
              <div className="glass rounded-xl p-1 flex items-center gap-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brand.com"
                  maxLength={255}
                  disabled={status === "loading"}
                  className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "success" ? (
                    <>
                      <Check className="h-4 w-4" /> Done
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} LetUGrow. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
          <p>Made with <span className="text-primary">🌱</span> in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
