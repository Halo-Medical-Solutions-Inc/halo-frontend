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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const cancelled = searchParams.get("cancelled") === "true";

  const handlePayment = async () => {
    if (!session?.session_id) {
      setError("No active session. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get user info to get user_id
      const user = await apiGetUser(session.session_id);
      
      // Create checkout session
      const { checkout_url } = await apiCreateCheckoutSession(user.user_id!);
      
      // Redirect to Stripe checkout
      window.location.href = checkout_url;
    } catch (err: any) {
      setError("Failed to create payment session. Please try again.");
      console.error("Payment error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Subscription Required</h2>
            <p className="text-sm text-muted-foreground">
              {cancelled 
                ? "Uh-oh! You need to complete payment to access the dashboard." 
                : "To access your dashboard, please complete your subscription."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="text-center space-y-4">
            <Button 
              onClick={handlePayment} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p className="font-semibold">$20.00/month</p>
              <p>Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 