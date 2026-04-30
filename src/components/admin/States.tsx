import { AlertTriangle, Inbox, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "./ui";

export function LoadingState() {
  return (
    <div className="p-12 grid place-items-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
