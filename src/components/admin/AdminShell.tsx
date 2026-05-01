import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Quote,
  FileText,
  Mail,
  Sparkles,
  Settings,
  LogOut,
  Loader2,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Crown,
  FileBarChart,
  MessageCircle,
  Package,
} from "lucide-react";
import logoSrc from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/team", label: "Team", Icon: Users },
  { to: "/admin/portfolio", label: "Portfolio", Icon: Briefcase },
  { to: "/admin/services", label: "Services", Icon: Sparkles },
  { to: "/admin/packages", label: "Packages", Icon: Package },
  { to: "/admin/testimonials", label: "Testimonials", Icon: Quote },
  { to: "/admin/blog", label: "Blog", Icon: FileText },
  { to: "/admin/contacts", label: "Contacts", Icon: Mail },
  { to: "/admin/clients", label: "Clients", Icon: Users, group: "Clients" },
  { to: "/admin/memberships", label: "Memberships", Icon: Crown },
  { to: "/admin/client-reports", label: "Client Reports", Icon: FileBarChart },
  { to: "/admin/client-tickets", label: "Client Tickets", Icon: MessageCircle },
  { to: "/admin/settings", label: "Settings", Icon: Settings, group: "System" },
] as const;

export function AdminShell({ children }: { children?: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AuthProvider>
  );
}

function AdminShellContent({ children }: { children?: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/admin/login" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-md text-center glass rounded-2xl p-8">
          <ShieldAlert className="h-10 w-10 text-primary mx-auto" />
          <h1 className="mt-4 text-xl font-display font-semibold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user.email}) doesn't have admin access. Ask an existing admin to grant
            access in Settings → Admins.
          </p>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const initials = (user.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar (fixed) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[280px] flex-col border-r border-border/60 bg-[oklch(0.14_0.012_160)]/60 backdrop-blur z-30">
        <SidebarBody pathname={pathname} email={user.email ?? ""} onSignOut={async () => { await signOut(); navigate({ to: "/admin/login" }); }} />
      </aside>

      {/* Mobile drawer */}
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
              <SidebarBody pathname={pathname} email={user.email ?? ""} onSignOut={async () => { await signOut(); navigate({ to: "/admin/login" }); }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-border/60 bg-background/80 backdrop-blur flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-lg hover:bg-muted/40 -ml-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden font-display font-semibold text-sm">Admin</div>
          <div className="hidden lg:block" />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-muted/40 p-1 pr-2 min-h-[44px]">
              <span className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                {initials}
              </span>
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                {user.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings"><UserIcon className="h-4 w-4 mr-2" /> Profile & settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate({ to: "/admin/login" }); }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  pathname,
  email,
  onSignOut,
}: {
  pathname: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="p-5 flex items-center gap-2">
        <Link to="/" className="flex items-center">
          <img src={logoSrc} alt="Let Us Grow" className="h-8 w-auto object-contain" />
        </Link>
        <span className="ml-1 text-[10px] uppercase tracking-wider rounded bg-primary/15 text-primary px-1.5 py-0.5">
          admin
        </span>
      </div>
      <nav className="px-3 py-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {nav.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
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
        <div className="px-3 py-1 text-xs text-muted-foreground truncate">{email}</div>
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
