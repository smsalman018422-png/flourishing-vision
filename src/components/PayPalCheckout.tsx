import { useMemo } from "react";
import { Loader2, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackPurchase } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";

export type PayPalCaptureDetails = {
  id?: string;
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
};

interface PayPalCheckoutProps {
  packageName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  currency?: string;
  onSuccess: (orderId: string, details: PayPalCaptureDetails) => void | Promise<void>;
  onCancel?: () => void;
}

export function PayPalCheckout({
  packageName,
  amount,
  billingCycle,
  currency = "USD",
  onSuccess,
  onCancel,
}: PayPalCheckoutProps) {
  const { data: settings, isLoading } = useSiteSettings();

  const mode: "sandbox" | "live" =
    settings?.paypal_mode === "live" ? "live" : "sandbox";

  const clientId = useMemo(() => {
    const liveId = settings?.paypal_client_id_live?.trim();
    const sandboxId = settings?.paypal_client_id_sandbox?.trim();
    // Backward fallback to legacy single key
    const legacy = settings?.paypal_client_id?.trim();
    if (mode === "live") return liveId || "";
    return sandboxId || legacy || "";
  }, [settings, mode]);

  const businessEmail = settings?.paypal_business_email?.trim();

  const summary = (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Package</span>
        <span className="font-medium">{packageName}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-muted-foreground">Billing</span>
        <span className="font-medium capitalize">{billingCycle}</span>
      </div>
      <div className="flex justify-between mt-2 pt-2 border-t border-border/60">
        <span className="font-semibold">Total</span>
        <span className="font-bold">
          ${amount.toFixed(2)} {currency}
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {summary}
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment options…
        </div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="space-y-3">
        {summary}
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            PayPal is not configured for <strong>{mode}</strong> mode. Please contact us
            or try again later.
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <a href="/contact">Contact us</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Re-mount provider if mode/clientId changes so SDK reloads cleanly
  const providerKey = `${mode}:${clientId}:${currency}`;

  return (
    <div className="space-y-3">
      {summary}

      {mode === "sandbox" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Sandbox mode — test payment, no real money will be charged.
        </div>
      )}

      <PayPalScriptProvider
        key={providerKey}
        options={{
          clientId,
          currency,
          intent: "capture",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 45 }}
          createOrder={(_data, actions) =>
            actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: `${packageName} — ${billingCycle} subscription`,
                  amount: { currency_code: currency, value: amount.toFixed(2) },
                  ...(businessEmail ? { payee: { email_address: businessEmail } } : {}),
                },
              ],
              application_context: {
                brand_name: "LetUsGrow",
                shipping_preference: "NO_SHIPPING",
              },
            })
          }
          onApprove={async (_data, actions) => {
            try {
              const details = (await actions.order!.capture()) as PayPalCaptureDetails;
              try {
                trackPurchase({ content_name: packageName, value: amount, currency });
              } catch {
                // pixel optional
              }
              await onSuccess(details.id || _data.orderID, details);
            } catch (e) {
              console.error("PayPal capture failed", e);
              toast.error("Payment capture failed. Please contact support.");
            }
          }}
          onCancel={() => {
            toast.info("Payment cancelled");
            onCancel?.();
          }}
          onError={(err) => {
            console.error("PayPal error", err);
            toast.error("Payment error. Please try again.");
          }}
        />
      </PayPalScriptProvider>

      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" /> Secured by PayPal
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> 256-bit SSL
        </span>
      </div>
    </div>
  );
}
