import { type ReactNode } from "react";

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl p-4 sm:p-6 ${className}`}>{children}</div>;
}

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

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInput} min-h-[120px] py-2.5 ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} ${props.className ?? ""}`} />;
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
