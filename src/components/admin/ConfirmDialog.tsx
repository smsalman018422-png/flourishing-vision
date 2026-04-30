import { useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "./ui";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onCancel,
  onConfirm,
  children,
}: Props) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 backdrop-blur p-4">
      <div className="glass-strong rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-5 w-5 text-destructive" />}
            <h2 className="font-display font-semibold">{title}</h2>
          </div>
          <button onClick={onCancel} className="grid place-items-center h-9 w-9 rounded-lg hover:bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 text-sm text-muted-foreground">
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border/60">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
