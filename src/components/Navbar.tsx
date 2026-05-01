import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Moon, Sun, Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Team", href: "/team" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<{
    kind: "anon" | "client" | "admin";
    name: string;
  }>({ kind: "anon", name: "" });

  useEffect(() => {
    let mounted = true;
    const detect = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (mounted) setAuthState({ kind: "anon", name: "" });
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("client_profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!mounted) return;
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (isAdmin) {
        setAuthState({ kind: "admin", name: user.email ?? "Admin" });
      } else if (profile) {
        setAuthState({ kind: "client", name: profile.full_name || user.email || "" });
      } else {
        setAuthState({ kind: "anon", name: "" });
      }
    };
    void detect();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void detect());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const initials = authState.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 h-14 transition-all duration-300 ${
              scrolled ? "glass-strong shadow-elegant" : "bg-transparent"
            }`}
          >
            <Link to="/" className="flex items-center gap-2 group min-h-11">
              <span className="relative grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
                <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display font-semibold tracking-tight text-lg">
                LetU<span className="text-gradient">Grow</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    to={l.href}
                    className={`relative px-4 py-2 text-sm transition-colors ${
                      active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute left-4 right-4 -bottom-0.5 h-px bg-gradient-primary origin-left transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="grid place-items-center h-11 w-11 lg:h-9 lg:w-9 rounded-xl glass hover:scale-105 active:scale-95 transition-transform"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 text-accent" />
                    ) : (
                      <Moon className="h-4 w-4 text-primary" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>

              {authState.kind === "anon" ? (
                <>
                  <Link
                    to="/client/login"
                    className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Login
                  </Link>
                  <Link
                    to="/client/signup"
                    className="hidden lg:inline-flex items-center h-9 px-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  to={authState.kind === "admin" ? "/admin" : "/client/dashboard"}
                  className="hidden lg:inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                    {initials}
                  </span>
                  {authState.kind === "admin" ? "Admin" : "Dashboard"}
                </Link>
              )}

              <Link
                to="/contact"
                className="hidden lg:inline-flex items-center h-9 px-4 rounded-xl text-sm font-medium bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elegant hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Book a Call
              </Link>

              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className="lg:hidden grid place-items-center h-11 w-11 rounded-xl glass relative"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={open ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 grid place-items-center"
                  >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile/Tablet Drawer */}
      <AnimatePresence>
        {open && (
          <div className="lg:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="absolute top-0 right-0 h-full w-full md:w-[60%] glass-strong shadow-elegant border-l border-border/60 flex flex-col pt-24 px-6 pb-8"
            >
              <nav className="flex flex-col gap-1">
                {links.map((l, i) => {
                  const active = isActive(l.href);
                  return (
                    <motion.div
                      key={l.href}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                    >
                      <Link
                        to={l.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center min-h-12 px-4 rounded-xl text-base transition-colors ${
                          active
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + links.length * 0.05, duration: 0.3, ease: "easeOut" }}
                >
                  {authState.kind === "anon" ? (
                    <>
                      <Link
                        to="/client/login"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 min-h-12 px-4 rounded-xl text-base text-foreground hover:bg-muted transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                      <Link
                        to="/client/signup"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 min-h-12 px-4 rounded-xl text-base text-primary hover:bg-primary/10 transition-colors font-medium"
                      >
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={authState.kind === "admin" ? "/admin" : "/client/dashboard"}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 min-h-12 px-4 rounded-xl text-base text-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {authState.kind === "admin" ? "Admin" : "Dashboard"}
                    </Link>
                  )}
                </motion.div>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + links.length * 0.05, duration: 0.3 }}
                className="mt-6"
              >
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center min-h-12 px-4 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  Book a Call
                </Link>
              </motion.div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
