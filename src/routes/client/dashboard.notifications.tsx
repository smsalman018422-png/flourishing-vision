import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

type Notification = {
  id: string;
  client_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string | null;
};

export const Route = createFileRoute("/client/dashboard/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId, ready } = useClientAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("client_notifications")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setNotifications((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_notifications",
          filter: `client_id=eq.${userId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    setMarking(true);
    const { error } = await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("client_id", userId)
      .eq("is_read", false);
    setMarking(false);
    if (error) toast.error(error.message);
    else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All marked as read");
    }
  };

  const onClick = async (n: Notification) => {
    if (!n.is_read) {
      const { error } = await supabase
        .from("client_notifications")
        .update({ is_read: true })
        .eq("id", n.id);
      if (!error) {
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
        );
      }
    }
    if (n.link) {
      if (/^https?:\/\//i.test(n.link)) {
        window.open(n.link, "_blank", "noopener,noreferrer");
      } else {
        // Internal route
        navigate({ to: n.link as "/client/dashboard" });
      }
    }
  };

  if (!ready || loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => void markAllRead()}
          disabled={marking || unreadCount === 0}
        >
          {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark all as read"}
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No notifications yet. We'll notify you about new reports, membership
              updates, and ticket replies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={() => void onClick(n)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const { Icon, tint } = iconFor(n.type);
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left rounded-xl border transition-colors p-4 flex gap-3 ${
          n.is_read
            ? "bg-card border-border hover:bg-accent/40"
            : "border-emerald-500/30"
        }`}
        style={!n.is_read ? { backgroundColor: "rgba(26, 107, 60, 0.06)" } : undefined}
      >
        <span
          className={`grid place-items-center h-9 w-9 rounded-full shrink-0 ${tint}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm truncate ${n.is_read ? "" : "font-semibold"}`}>
              {n.title}
            </p>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {timeAgo(n.created_at)}
            </span>
          </div>
          {n.body && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {n.body}
            </p>
          )}
        </div>
        {!n.is_read && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0"
          />
        )}
      </button>
    </li>
  );
}

function iconFor(type: string) {
  switch (type) {
    case "success":
      return {
        Icon: CheckCircle2,
        tint: "bg-emerald-500/15 text-emerald-600",
      };
    case "warning":
      return {
        Icon: AlertTriangle,
        tint: "bg-amber-500/15 text-amber-600",
      };
    case "alert":
    case "error":
      return {
        Icon: AlertCircle,
        tint: "bg-rose-500/15 text-rose-600",
      };
    default:
      return {
        Icon: Info,
        tint: "bg-blue-500/15 text-blue-600",
      };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
