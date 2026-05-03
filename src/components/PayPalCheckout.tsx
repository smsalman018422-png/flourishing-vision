import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { getPayPalSettings, loadPayPalScript } from "@/lib/paypal";
import { Button } from "@/components/ui/button";

export type PayPalCaptureDetails = {
  id?: string;
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
};

interface PayPalCheckoutProps {
  packageName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  onSuccess: (orderId: string, details: PayPalCaptureDetails) => void | Promise<void>;
  onCancel?: () => void;
}

export function PayPalCheckout({
  packageName,
  amount,
  billingCycle,
  onSuccess,
  onCancel,
}: PayPalCheckoutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await getPayPalSettings();
        if (!cfg.clientId) {
          setError("Payment system is not configured yet. Please contact us.");
          setLoading(false);
          return;
        }
        await loadPayPalScript(cfg.clientId);
        if (!mounted || !ref.current) return;
        ref.current.innerHTML = "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paypal = (window as any).paypal;
        if (!paypal?.Buttons) {
          setError("PayPal failed to initialise.");
          setLoading(false);
          return;
        }

        paypal
          .Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 45 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            createOrder: (_d: unknown, actions: any) =>
              actions.order.create({
                purchase_units: [
                  {
                    description: `${packageName} — ${billingCycle} subscription`,
                    amount: { value: amount.toFixed(2), currency_code: "USD" },
                  },
                ],
                application_context: {
                  brand_name: "LetUsGrow",
                  shipping_preference: "NO_SHIPPING",
                },
              }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onApprove: async (data: { orderID: string }, actions: any) => {
              try {
                const details = (await actions.order.capture()) as PayPalCaptureDetails;
                await onSuccess(data.orderID, details);
              } catch (e) {
                console.error("PayPal capture failed", e);
                toast.error("Payment capture failed. Please contact support.");
              }
            },
            onCancel: () => {
              toast.info("Payment cancelled");
              onCancel?.();
            },
            onError: (err: unknown) => {
              console.error("PayPal error", err);
              toast.error("Payment error. Please try again.");
            },
          })
          .render(ref.current);

        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Failed to load payment options. Please try again.");
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [amount, packageName, billingCycle, onSuccess, onCancel]);

  return (
    <div className="space-y-3">
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
          <span className="font-bold">${amount.toFixed(2)} USD</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment options…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <a href="/contact">Contact us instead</a>
            </Button>
          </div>
        </div>
      )}

      <div ref={ref} className={loading || error ? "hidden" : "min-h-[160px]"} />

      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secured by PayPal</span>
        <span>•</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> 256-bit SSL</span>
      </div>
    </div>
  );
}
