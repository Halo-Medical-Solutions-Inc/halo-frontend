"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequestPasswordReset } from "@/store/api";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      try {
        await apiRequestPasswordReset(email);
        setIsSubmitted(true);
      } catch (err: any) {
        setValidationErrors({
          email: "Failed to send reset code. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center flex flex-col items-center gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-2xl font-bold">Check your email</h2>
              <p className="text-sm text-muted-foreground">If an account with that email exists, we've sent you a password reset code.</p>
            </div>
          </div>

          <div className="space-y-6">
            <Button onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)} className="w-full">
              Continue to Reset Password
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/signin" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Forgot your password?</h2>
            <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a reset code</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email<span className="text-destructive">*</span>
            </Label>
            <Input id="email" type="email" placeholder="email@halo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!validationErrors.email} className={validationErrors.email ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
          </div>

          <div className="space-y-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/signin" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
