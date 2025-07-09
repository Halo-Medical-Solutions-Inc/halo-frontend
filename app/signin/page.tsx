"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits, apiSigninUser, apiCheckSubscription } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { setTemplates } from "@/store/slices/templateSlice";
import { setVisits } from "@/store/slices/visitSlice";
import { setUser } from "@/store/slices/userSlice";

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-reset-success") {
      setSuccessMessage("Password reset successfully! You can now sign in with your new password.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      try {
        const session = await apiSigninUser(email, password);

        if (session) {
          if (session.verification_needed) {
            router.push(`/verify-email?session_id=${session.session_id}`);
          } else {
            dispatch(setSession(session));
            localStorage.setItem("session", JSON.stringify(session));
            if (session.session_id) {
              const user = await apiGetUser(session.session_id);
              dispatch(setUser(user));

              // Check if user has active subscription
              const { has_active_subscription } = await apiCheckSubscription(user.user_id!);
              
              if (!has_active_subscription) {
                // Redirect to payment page
                router.push("/payment-required");
                return;
              }

              apiGetUserTemplates(session.session_id).then((templates) => {
                dispatch(setTemplates(templates));
              });

              apiGetUserVisits(session.session_id).then((visits) => {
                dispatch(setVisits(visits));
              });
            }
            router.push("/dashboard");
          }
        }
      } catch (err: any) {
        setValidationErrors({
          email: " ",
          password: "Incorrect email or password",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          {/* <img src="/halo-logo.svg" alt="Halo Logo" className="size-8 rounded-lg" /> */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email<span className="text-destructive">*</span>
            </Label>
            <Input id="email" type="email" placeholder="email@halo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!validationErrors.email} className={validationErrors.email ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password<span className="text-destructive">*</span>
            </Label>
            <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!validationErrors.password} className={validationErrors.password ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.password && <p className="text-xs text-destructive">{validationErrors.password}</p>}
          </div>

          <div className="space-y-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Please wait
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center space-y-2">
              <Link href="/forgot-password" className="text-sm text-primary underline">
                Forgot your password?
              </Link>

              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
