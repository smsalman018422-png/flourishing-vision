import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
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
} from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/team", label: "Team", Icon: Users },
  { to: "/admin/portfolio", label: "Portfolio", Icon: Briefcase },
  { to: "/admin/testimonials", label: "Testimonials", Icon: Quote },
  { to: "/admin/blog", label: "Blog", Icon: FileText },
  { to: "/admin/contacts", label: "Contacts", Icon: Mail },
  { to: "/admin/services", label: "Services", Icon: Sparkles },
  { to: "/admin/settings", label: "Settings", Icon: Settings },
] as const;

export function AdminShell({ children }: { children?: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
          <h1 className="mt-4 text-xl font-display font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user.email}) doesn't have the admin role. Ask an existing admin to grant access in Settings → Admins.
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border/60 bg-[oklch(0.14_0.012_160)]/60 backdrop-blur">
        <div className="p-5 flex items-center justify-between lg:justify-start gap-3">
          <Link to="/" className="font-display font-semibold">
            Letus<span className="text-gradient">Grow</span>
            <span className="ml-2 text-xs text-muted-foreground">/ admin</span>
          </Link>
        </div>
        <nav className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
          {nav.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`min-h-[44px] flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:block px-3 pb-5 mt-2 border-t border-border/60 pt-4">
          <div className="px-3 text-xs text-muted-foreground truncate">{user.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
            className="mt-2 min-h-[44px] w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <main className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
