import { type ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const baseInput =
  "w-full min-h-[44px] rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Button({
  children,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const cls =
    variant === "primary"
      ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01]"
      : variant === "danger"
      ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
      : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40";
  return (
    <button
      {...rest}
      className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 disabled:hover:scale-100 ${cls} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
