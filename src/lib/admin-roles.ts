export type StaffRole = "super_admin" | "admin" | "manager" | "editor";

export const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  editor: "Editor",
};

export const ROLE_BADGE: Record<StaffRole, string> = {
  super_admin: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
  admin: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  manager: "bg-sky-500/15 text-sky-500 border border-sky-500/30",
  editor: "bg-muted text-muted-foreground border border-border/60",
};

// Permission keys used both for nav visibility and route guards
export type Permission =
  | "dashboard"
  | "team"
  | "portfolio"
  | "blog"
  | "testimonials"
  | "services"
  | "packages"
  | "contacts"
  | "settings"
  | "clients"
  | "memberships"
  | "client-reports"
  | "client-tickets"
  | "admin-users";

const ROLE_PERMS: Record<StaffRole, Permission[]> = {
  super_admin: [
    "dashboard","team","portfolio","blog","testimonials","services","packages","contacts","settings",
    "clients","memberships","client-reports","client-tickets","admin-users",
  ],
  admin: [
    "dashboard","team","portfolio","blog","testimonials","services","packages","contacts","settings",
    "clients","memberships","client-reports","client-tickets",
  ],
  manager: ["dashboard","clients","memberships","client-reports","client-tickets","contacts"],
  editor: ["dashboard","blog","portfolio","team","testimonials"],
};

export function rolesHavePermission(roles: StaffRole[], perm: Permission): boolean {
  return roles.some((r) => ROLE_PERMS[r]?.includes(perm));
}

export function highestRole(roles: StaffRole[]): StaffRole | null {
  const order: StaffRole[] = ["super_admin", "admin", "manager", "editor"];
  for (const r of order) if (roles.includes(r)) return r;
  return null;
}

export function isStaffRole(value: string): value is StaffRole {
  return value === "super_admin" || value === "admin" || value === "manager" || value === "editor";
}
