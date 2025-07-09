"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiCreateCheckoutSession, apiGetUser } from "@/store/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function Page() {
  const searchParams = useSearchParams();
  const session = useSelector((state: RootState) => state.session.session);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cancelled = searchParams.get("cancelled") === "true";

  const handlePayment = async (planType: string) => {
    if (!session?.session_id) {
      setError("No active session. Please sign in again.");
      return;
    }

    setIsLoading(planType);
    setError("");

    try {
      // Get user info to get user_id
      const user = await apiGetUser(session.session_id);

      // Create checkout session
      const { checkout_url } = await apiCreateCheckoutSession(user.user_id!, planType);

      // Redirect to Stripe checkout
      window.location.href = checkout_url;
    } catch (err: any) {
      setError("Failed to create payment session. Please try again.");
      console.error("Payment error:", err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-2xl p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Choose Your Subscription</h2>
            <p className="text-sm text-muted-foreground">{cancelled ? "Uh-oh! You need to complete payment to access the dashboard." : "To access your dashboard, please select a subscription plan."}</p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <div className="border rounded-lg p-6 space-y-4 hover:border-primary transition-colors flex flex-col cursor-pointer">
              <div className="text-center space-y-2 flex-1">
                <h3 className="text-lg font-semibold">Monthly Plan</h3>
                <div className="text-3xl font-bold">
                  $250<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">Billed monthly</p>
              </div>

              <Button onClick={() => handlePayment("monthly")} className="w-full mt-auto" disabled={isLoading !== null}>
                {isLoading === "monthly" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Choose Monthly"
                )}
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="border rounded-lg p-6 space-y-4 hover:border-primary transition-colors relative flex flex-col cursor-pointer">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">Best Value</span>
              </div>

              <div className="text-center space-y-2 flex-1">
                <h3 className="text-lg font-semibold">Yearly Plan</h3>
                <div className="text-3xl font-bold">
                  $200<span className="text-lg font-normal text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground">Billed annually</p>
                <p className="text-xs text-success">Save $600 per year!</p>
              </div>

              <Button onClick={() => handlePayment("yearly")} className="w-full mt-auto" disabled={isLoading !== null} variant="default">
                {isLoading === "yearly" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Choose Yearly"
                )}
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>✓ Cancel anytime</p>
            <p>✓ Full access to all features</p>
            <p>✓ 24/7 customer support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
