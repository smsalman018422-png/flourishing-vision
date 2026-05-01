import { AlertTriangle, Inbox, Plus, RefreshCw } from "lucide-react";
import { Button } from "./ui";

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-muted/20 p-4 animate-pulse">
          <div className="h-11 w-11 rounded-full bg-primary/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-primary/10" />
            <div className="h-3 w-1/2 rounded bg-primary/10" />
          </div>
          <div className="hidden sm:block h-8 w-20 rounded bg-primary/10" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-10 text-center">
      <AlertTriangle className="h-8 w-8 mx-auto text-destructive/80" />
      <p className="mt-3 text-sm font-medium">Couldn’t load data</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto break-words">{message}</p>
      <div className="mt-4">
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="p-12 text-center">
      <Inbox className="h-8 w-8 mx-auto text-muted-foreground/70" />
      <p className="mt-3 text-sm text-muted-foreground">{title}</p>
      <div className="mt-4">
        <Button onClick={onAction}>
          <Plus className="h-4 w-4" /> {actionLabel}
        </Button>
      </div>
    </div>
  );
}
