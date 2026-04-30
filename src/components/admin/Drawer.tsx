import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { Button } from "./ui";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  busy?: boolean;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  footer?: ReactNode;
};

export function Drawer({ open, title, onClose, onSubmit, submitLabel = "Save", busy, children, size = "md", footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const widthClass = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-xl";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className={`fixed inset-y-0 right-0 z-50 w-full ${widthClass} flex flex-col glass-strong border-l border-border/60`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 shrink-0">
              <h2 className="font-display font-semibold text-lg">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="grid place-items-center h-9 w-9 rounded-lg hover:bg-muted/40">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">{children}</div>
            <footer className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-border/60 shrink-0">
              {footer}
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              {onSubmit && (
                <Button type="button" onClick={onSubmit} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                </Button>
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
