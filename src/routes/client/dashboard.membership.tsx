import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Check, Loader2, AlertTriangle, XCircle, Sparkles } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  currency: string;
  features: unknown;
  sort_order: number;
  is_visible: boolean;
};

type Membership = {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
};

export const Route = createFileRoute("/client/dashboard/membership")({
  head: () => ({
    meta: [
      { title: "Membership — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembershipPage,
});

function MembershipPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        supabase
          .from("client_memberships")
          .select("*")
          .eq("client_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("membership_plans")
          .select("*")
          .eq("is_visible", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (mRes.error) toast.error(mRes.error.message);
      if (pRes.error) toast.error(pRes.error.message);
      const mem = (mRes.data as Membership | null) ?? null;
      const plans = (pRes.data as Plan[] | null) ?? [];
      setMembership(mem);
      setAllPlans(plans);
      setCurrentPlan(mem ? plans.find((p) => p.id === mem.plan_id) ?? null : null);
      setLoading(false);
    })();
  }, [userId]);

  const validity = useMemo(() => {
    if (!membership?.end_date)
      return { remaining: null as number | null, pct: 0, total: 0, expired: false };
    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const now = Date.now();
    const total = Math.max(1, Math.round((end - start) / 86400000));
    const remaining = Math.round((end - now) / 86400000);
    const elapsed = Math.max(0, Math.min(total, total - remaining));
    return {
      remaining,
      pct: Math.min(100, Math.max(0, (elapsed / total) * 100)),
      total,
      expired: now > end || membership.status === "expired",
    };
  }, [membership]);

  if (!ready || loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = membership?.status === "active" && !validity.expired;
  const features = featuresOf(currentPlan?.features);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="relative p-6 sm:p-8">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, hsl(var(--primary) / 0.25), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
                <div className="relative grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
                  <Crown className="h-8 w-8" />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current Plan
                </p>
                <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">
                  {currentPlan?.name ?? "No active plan"}
                </h1>
                {currentPlan && (
                  <p className="mt-1 text-lg text-muted-foreground">
                    {fmtMoney(currentPlan.price_monthly, currentPlan.currency)}
                    <span className="text-sm">/month</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {membership ? (
                isActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40 text-base px-3 py-1">
                    Active ✅
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/40 text-base px-3 py-1">
                    Expired ❌
                  </Badge>
                )
              ) : (
                <Badge variant="secondary">No subscription</Badge>
              )}
              <span className="text-xs text-muted-foreground">Billing: Monthly</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VALIDITY */}
      {membership && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Validity</h2>
              <div className="text-right">
                {validity.remaining != null ? (
                  <>
                    <p
                      className={`text-3xl font-bold ${
                        validity.expired
                          ? "text-rose-600"
                          : validity.remaining < 7
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {Math.max(0, validity.remaining)}
                    </p>
                    <p className="text-xs text-muted-foreground">days remaining</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No end date</p>
                )}
              </div>
            </div>

            {/* Timeline bar */}
            <div className="space-y-2">
              <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${validity.pct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-2 border-emerald-600 shadow"
                  style={{ left: `calc(${validity.pct}% - 10px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmtDate(membership.start_date)}</span>
                <span>{membership.end_date ? fmtDate(membership.end_date) : "—"}</span>
              </div>
            </div>

            {validity.expired ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                Your plan has expired. Contact us to renew.
              </div>
            ) : validity.remaining != null && validity.remaining < 7 ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                Renewing soon — {validity.remaining} day(s) left.
              </div>
            ) : null}

            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
              <span className="text-muted-foreground">Auto-renew</span>
              <span className="text-muted-foreground">OFF ❌</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PLAN FEATURES */}
      {currentPlan && features.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">Plan Features</h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="grid place-items-center h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ALL PLANS */}
      {allPlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">All Plans</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-x-auto">
            {allPlans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;
              const planFeatures = featuresOf(plan.features);
              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col ${
                    isCurrent ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : ""
                  }`}
                >
                  <CardContent className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <p className="mt-1 text-2xl font-bold">
                          {fmtMoney(plan.price_monthly, plan.currency)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40">
                          Current ✅
                        </Badge>
                      )}
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
                      {planFeatures.slice(0, 6).map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button asChild variant="outline" className="w-full">
                        <a href="/contact">
                          {currentPlan && plan.price_monthly > currentPlan.price_monthly
                            ? "Upgrade"
                            : "Contact Us"}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function featuresOf(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  return [];
}

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
