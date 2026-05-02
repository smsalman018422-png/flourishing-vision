import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  FileText,
  Wallet,
  CalendarClock,
  CircleDollarSign,
} from "lucide-react";

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  file_url: string | null;
  file_path: string | null;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  payment_date: string;
};

type Membership = {
  end_date: string | null;
  amount: number;
  billing_cycle: string;
  is_custom: boolean;
  custom_name: string | null;
  package: { name: string; price_monthly: number } | null;
};

export const Route = createFileRoute("/client/dashboard/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const PAGE_SIZE = 10;

function BillingPage() {
  const { userId, ready } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLimit, setPaymentLimit] = useState(PAGE_SIZE);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const [invRes, payRes, memRes] = await Promise.all([
        supabase
          .from("client_invoices")
          .select("*")
          .eq("client_id", userId)
          .order("issue_date", { ascending: false }),
        supabase
          .from("client_payments")
          .select("*")
          .eq("client_id", userId)
          .order("payment_date", { ascending: false }),
        supabase
          .from("client_memberships")
          .select("end_date, amount, billing_cycle, is_custom, custom_name, package:packages(name, price_monthly)")
          .eq("client_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (invRes.error) toast.error(invRes.error.message);
      if (payRes.error) toast.error(payRes.error.message);
      setInvoices((invRes.data ?? []) as Invoice[]);
      setPayments((payRes.data ?? []) as Payment[]);
      setMembership((memRes.data ?? null) as unknown as Membership | null);
      setLoading(false);
    })();
  }, [userId]);

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount), 0),
    [payments],
  );

  const planCurrency = "USD";

  if (!ready || loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
          Billing
        </h1>
        <p className="text-sm text-muted-foreground">Invoices and payment history.</p>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          label="Total Paid"
          value={fmtMoney(totalPaid, planCurrency)}
          tint="emerald"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Current Plan Cost"
          value={
            membership
              ? `${fmtMoney(membership.amount, planCurrency)}/${membership.billing_cycle === "yearly" ? "yr" : "mo"}`
              : "—"
          }
          tint="primary"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Next Payment"
          value={membership?.end_date ? fmtDate(membership.end_date) : "—"}
          tint="amber"
        />
      </div>

      {/* INVOICES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyCard message="No billing history yet." />
        ) : (
          <div className="grid gap-3">
            {invoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </section>

      {/* PAYMENTS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Payment History</h2>
        {payments.length === 0 ? (
          <EmptyCard message="No payments recorded yet." />
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Header — desktop only */}
              <div className="hidden sm:grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <span>Date</span>
                <span>Amount</span>
                <span>Method</span>
                <span>Status</span>
              </div>
              <ul className="divide-y divide-border/60">
                {payments.slice(0, paymentLimit).map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-4 py-3 text-sm"
                  >
                    <span className="text-muted-foreground sm:text-foreground">
                      {fmtDate(p.payment_date)}
                    </span>
                    <span className="font-medium text-right sm:text-left">
                      {fmtMoney(Number(p.amount), p.currency)}
                    </span>
                    <span className="capitalize text-muted-foreground">{p.method}</span>
                    <span>
                      <PaymentStatusBadge status={p.status} />
                    </span>
                  </li>
                ))}
              </ul>
              {payments.length > paymentLimit && (
                <div className="p-3 border-t border-border/60">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setPaymentLimit((n) => n + PAGE_SIZE)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tint: "emerald" | "primary" | "amber";
}) {
  const tintCls =
    tint === "emerald"
      ? "bg-emerald-500/15 text-emerald-600"
      : tint === "amber"
        ? "bg-amber-500/15 text-amber-600"
        : "bg-primary/15 text-primary";
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <span className={`grid place-items-center h-11 w-11 rounded-xl ${tintCls}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoice.file_path && !invoice.file_url) {
      toast.error("Invoice available soon");
      return;
    }
    setDownloading(true);
    try {
      if (invoice.file_path) {
        const { data, error } = await supabase.storage
          .from("client-reports")
          .download(invoice.file_path);
        if (error) throw error;
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          invoice.file_path.split("/").pop() ?? `${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (invoice.file_url) {
        window.open(invoice.file_url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const hasFile = !!(invoice.file_path || invoice.file_url);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid place-items-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold truncate">{invoice.invoice_number}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{fmtDate(invoice.issue_date)}</span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {fmtMoney(Number(invoice.amount), invoice.currency)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
            {hasFile ? (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                )}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Invoice available soon</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "paid")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40">
        Paid ✅
      </Badge>
    );
  if (s === "overdue")
    return (
      <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/40">Overdue ❌</Badge>
    );
  return (
    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40">Pending ⏳</Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "completed")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40">
        Completed
      </Badge>
    );
  if (s === "failed")
    return (
      <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/40">Failed</Badge>
    );
  return (
    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40">Pending</Badge>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
