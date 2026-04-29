import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const links = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-300 ${
          scrolled ? "" : ""
        }`}
      >
        <div
          className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 h-14 transition-all duration-300 ${
            scrolled ? "glass-strong shadow-elegant" : "bg-transparent"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
              <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="font-display font-semibold tracking-tight text-lg">
              LetUs<span className="text-gradient">Grow</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                {l.label}
                <span className="absolute left-4 right-4 -bottom-0.5 h-px bg-gradient-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid place-items-center h-9 w-9 rounded-xl glass hover:scale-105 active:scale-95 transition-transform"
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

            <a
              href="/#contact"
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-xl text-sm font-medium bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elegant hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Start growing
            </a>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden grid place-items-center h-9 w-9 rounded-xl glass"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden mt-2 glass-strong rounded-2xl p-3 shadow-elegant"
            >
              <div className="flex flex-col">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href="/#contact"
                  onClick={() => setOpen(false)}
                  className="mt-2 text-center px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground"
                >
                  Start growing
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
