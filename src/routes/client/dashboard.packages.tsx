import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package as PackageIcon,
  Check,
  Loader2,
  Sparkles,
  Crown,
  Clock,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/client/dashboard/packages")({
  head: () => ({
    meta: [
      { title: "My Packages — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPackagesPage,
});

type FeatureItem = { text: string; type?: "feature" | "bonus" } | string;

type Membership = {
  id: string;
  client_id: string;
  package_id: string | null;
  plan_id: string | null;
  status: string;
  billing_cycle: string;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  is_custom: boolean;
  custom_name: string | null;
  custom_features: FeatureItem[];
  payment_method?: string | null;
  transaction_id?: string | null;
  payment_status?: string | null;
  note?: string | null;
  package?: {
    id: string;
    name: string;
    category: string;
    tagline: string | null;
    icon_name: string;
    features: FeatureItem[];
    is_premium: boolean;
  } | null;
  plan?: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    features: FeatureItem[];
    bonus_features: FeatureItem[];
  } | null;
};

type PendingRequest = {
  id: string;
  status: string;
  billing_cycle: string;
  amount: number;
  created_at: string;
  package?: { name: string } | null;
};

function MyPackagesPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);

  const load = async () => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [mRes, pRes] = await Promise.all([
      sb
        .from("client_memberships")
        .select(
          "*, package:packages(id,name,category,tagline,icon_name,features,is_premium), plan:membership_plans(id,name,category,description,features,bonus_features)",
        )
        .eq("client_id", userId)
        .order("created_at", { ascending: false }),
      sb
        .from("package_purchase_requests")
        .select("id,status,billing_cycle,amount,created_at,package:packages(name)")
        .eq("client_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    if (mRes.error) toast.error(mRes.error.message);
    setMemberships(mRes.data ?? []);
    setPending(pRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void load();
    const ch1 = supabase
      .channel(`pkg-mem-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_memberships",
          filter: `client_id=eq.${userId}`,
        },
        () => void load(),
      )
      .subscribe();
    const ch2 = supabase
      .channel(`pkg-req-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "package_purchase_requests",
          filter: `client_id=eq.${userId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch1);
      void supabase.removeChannel(ch2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const active = useMemo(
    () =>
      memberships.filter(
        (m) => m.status === "active" && m.end_date && new Date(m.end_date) > new Date(),
      ),
    [memberships],
  );
  const pendingMemberships = useMemo(
    () => memberships.filter((m) => m.status === "pending"),
    [memberships],
  );
  const past = useMemo(
    () =>
      memberships.filter(
        (m) =>
          m.status !== "pending" &&
          (m.status !== "active" || (m.end_date && new Date(m.end_date) <= new Date())),
      ),
    [memberships],
  );

  if (!ready || loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight flex items-center gap-2">
            <PackageIcon className="h-7 w-7 text-primary" />
            My Packages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your active services and explore new packages.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/pricing">
            <ShoppingBag className="h-4 w-4" />
            Browse Packages
          </Link>
        </Button>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold">Pending Approval ({pending.length})</h2>
            </div>
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-background p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.package?.name ?? "Package"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.billing_cycle} · ${p.amount} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/40">
                  Awaiting approval
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending memberships (manual payment requests) */}
      {pendingMemberships.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold">Awaiting Approval ({pendingMemberships.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMemberships.map((m) => (
              <PackageCard key={m.id} membership={m} />
            ))}
          </div>
        </section>
      )}

      {/* Active packages */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Active ({active.length})</h2>
        </div>
        {active.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center">
                <PackageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                You don't have any active packages yet.
              </p>
              <Button asChild>
                <Link to="/pricing">Explore Packages</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((m) => (
              <PackageCard key={m.id} membership={m} />
            ))}
          </div>
        )}
      </section>

      {/* Past packages */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">History ({past.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map((m) => (
              <PackageCard key={m.id} membership={m} muted />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PackageCard({ membership, muted }: { membership: Membership; muted?: boolean }) {
  const name =
    membership.is_custom && membership.custom_name
      ? membership.custom_name
      : membership.package?.name ?? membership.plan?.name ?? "Package";
  const featuresRaw = membership.is_custom
    ? membership.custom_features
    : membership.package?.features ?? [
        ...(membership.plan?.features ?? []),
        ...(membership.plan?.bonus_features ?? []),
      ];
  const features = normalizeFeatures(featuresRaw);
  const isPremium = membership.package?.is_premium && !membership.is_custom;

  const start = membership.start_date ? new Date(membership.start_date).getTime() : 0;
  const end = membership.end_date ? new Date(membership.end_date).getTime() : 0;
  const now = Date.now();
  const total = Math.max(1, Math.round((end - start) / 86400000));
  const remaining = end ? Math.max(0, Math.round((end - now) / 86400000)) : 0;
  const elapsed = Math.max(0, Math.min(total, total - remaining));
  const pct = end ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  const expired = membership.status === "pending" ? false : !end || now > end || membership.status !== "active";

  return (
    <Card
      className={`relative overflow-hidden transition ${
        muted ? "opacity-70" : ""
      } ${isPremium ? "border-amber-500/40" : ""}`}
    >
      {isPremium && (
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle at 100% 0%, oklch(0.85 0.15 75 / 0.4), transparent 60%)" }} />
      )}
      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`grid place-items-center h-11 w-11 rounded-xl shrink-0 ${
                isPremium
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                  : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
              }`}
            >
              {membership.is_custom ? (
                <Gift className="h-5 w-5" />
              ) : isPremium ? (
                <Crown className="h-5 w-5" />
              ) : (
                <PackageIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{name}</h3>
                {membership.is_custom && (
                  <Badge variant="outline" className="text-[10px]">CUSTOM</Badge>
                )}
                {isPremium && (
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/40 text-[10px]">
                    PREMIUM
                  </Badge>
                )}
              </div>
              {membership.package?.tagline && !membership.is_custom && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {membership.package.tagline}
                </p>
              )}
            </div>
          </div>
          {expired ? (
            <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/40 shrink-0">
              <XCircle className="h-3 w-3 mr-1" /> Expired
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/40 shrink-0">
              Active
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground capitalize">
            {membership.billing_cycle} · ${membership.amount}
          </span>
          {!expired && (
            <span
              className={`font-medium ${
                remaining < 7 ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              {remaining} day{remaining === 1 ? "" : "s"} left
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${
                expired
                  ? "bg-rose-500"
                  : remaining < 7
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-600"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{membership.start_date ? fmtDate(membership.start_date) : "—"}</span>
            <span>{membership.end_date ? fmtDate(membership.end_date) : "Pending"}</span>
          </div>
        </div>

        {!expired && remaining < 7 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Expires soon — contact your account manager to renew.
          </div>
        )}

        {features.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-primary list-none flex items-center gap-1">
              <span>View {features.length} feature{features.length === 1 ? "" : "s"}</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <ul className="mt-3 space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`grid place-items-center h-4 w-4 rounded-full shrink-0 mt-0.5 ${
                      f.type === "bonus"
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-emerald-500/20 text-emerald-500"
                    }`}
                  >
                    {f.type === "bonus" ? (
                      <Gift className="h-2.5 w-2.5" />
                    ) : (
                      <Check className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeFeatures(raw: unknown): { text: string; type: "feature" | "bonus" }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { text: item, type: "feature" as const };
      if (item && typeof item === "object") {
        const obj = item as { text?: unknown; type?: unknown };
        const text = typeof obj.text === "string" ? obj.text : "";
        const type = obj.type === "bonus" ? "bonus" : "feature";
        return { text, type };
      }
      return null;
    })
    .filter((f): f is { text: string; type: "feature" | "bonus" } => !!f && !!f.text);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
