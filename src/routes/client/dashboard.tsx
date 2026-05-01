import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  FileBarChart,
  Crown,
  CreditCard,
  MessageCircle,
  Settings,
  Bell,
  LogOut,
  Loader2,
  Menu,
  X,
  Leaf,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/client/dashboard")({
  head: () => ({
    meta: [
      { title: "Client Dashboard — LetUsGrow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientDashboardLayout,
});

type ClientProfile = {
  id: string;
  full_name: string;
  company_name: string | null;
  avatar_url: string | null;
};

const nav: Array<{ to: string; label: string; Icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/client/dashboard", label: "Overview", Icon: LayoutDashboard, exact: true },
  { to: "/client/dashboard/projects", label: "Projects", Icon: FolderKanban },
  { to: "/client/dashboard/reports", label: "Reports", Icon: FileBarChart },
  { to: "/client/dashboard/membership", label: "Membership", Icon: Crown },
  { to: "/client/dashboard/billing", label: "Billing", Icon: CreditCard },
  { to: "/client/dashboard/tickets", label: "Support", Icon: MessageCircle },
  { to: "/client/dashboard/notifications", label: "Notifications", Icon: Bell },
  { to: "/client/dashboard/settings", label: "Settings", Icon: Settings },
];

function ClientDashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drawerOpen]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const uid = data.session?.user.id;
      if (!uid) {
        navigate({ to: "/client/login" });
        return;
      }
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("id,full_name,company_name,avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (!mounted) return;
      if (!profile) {
        await supabase.auth.signOut();
        navigate({ to: "/client/login" });
        return;
      }
      setClient(profile as ClientProfile);
      setLoading(false);
    };
    void check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/client/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  // Track unread notifications for the sidebar bell
  useEffect(() => {
    if (!client?.id) return;
    const refresh = async () => {
      const { count } = await supabase
        .from("client_notifications")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    };
    void refresh();
    const channel = supabase
      .channel(`sidebar-notif-${client.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_notifications",
          filter: `client_id=eq.${client.id}`,
        },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [client?.id]);

  if (loading || !client) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const initials = client.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[280px] flex-col border-r border-border/60 bg-[oklch(0.14_0.012_160)]/60 backdrop-blur z-30">
        <SidebarBody pathname={pathname} client={client} onSignOut={onSignOut} unreadCount={unreadCount} />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[85%] max-w-[320px] z-50 border-r border-border/60 bg-[oklch(0.12_0.012_160)] flex flex-col"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 h-10 w-10 grid place-items-center rounded-lg hover:bg-muted/40"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarBody pathname={pathname} client={client} onSignOut={onSignOut} unreadCount={unreadCount} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 h-14 border-b border-border/60 bg-background/80 backdrop-blur flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-lg hover:bg-muted/40 -ml-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden font-display font-semibold text-sm">Client</div>
          <div className="hidden lg:block" />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-muted/40 p-1 pr-2 min-h-[44px]">
              <span className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                {initials}
              </span>
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                {client.full_name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs">{client.full_name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/client/dashboard/settings">
                  <UserIcon className="h-4 w-4 mr-2" /> Profile & settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  pathname,
  client,
  onSignOut,
}: {
  pathname: string;
  client: ClientProfile;
  onSignOut: () => void;
}) {
  const initials = client.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <>
      <div className="p-5 flex items-center gap-2">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
          <Leaf className="h-4 w-4 text-primary-foreground" />
        </span>
        <Link to="/" className="font-display font-semibold">
          Letus<span className="text-gradient">Grow</span>
        </Link>
        <span className="ml-1 text-[10px] uppercase tracking-wider rounded bg-primary/15 text-primary px-1.5 py-0.5">
          client
        </span>
      </div>
      <nav className="px-3 py-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {nav.map(({ to, label, Icon, exact }) => {
            const active = exact
              ? pathname === to
              : pathname === to || pathname.startsWith(to + "/");
            return (
              <li key={to}>
                <Link
                  to={to as "/client/dashboard"}
                  className={`min-h-[44px] flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 border-t border-border/60">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="text-sm truncate">{client.full_name}</div>
            {client.company_name && (
              <div className="text-xs text-muted-foreground truncate">{client.company_name}</div>
            )}
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-1 min-h-[44px] w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );
}
