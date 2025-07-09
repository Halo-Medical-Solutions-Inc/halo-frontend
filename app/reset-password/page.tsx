"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiVerifyResetCode, apiResetPassword } from "@/store/api";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"code" | "password">("code");
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!code.trim()) {
      errors.code = "Reset code is required";
    } else if (!/^\d{4}$/.test(code)) {
      errors.code = "Please enter a valid 4-digit code";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      try {
        await apiVerifyResetCode(email, code);
        setStep("password");
        setValidationErrors({});
      } catch (err: any) {
        setValidationErrors({
          code: "Invalid or expired reset code",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      try {
        await apiResetPassword(email, code, newPassword);
        router.push("/signin?message=password-reset-success");
      } catch (err: any) {
        setValidationErrors({
          newPassword: "Failed to reset password. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (step === "code") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center flex flex-col items-center gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-2xl font-bold">Enter reset code</h2>
              <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to your email address</p>
              {timeLeft > 0 && <p className="text-xs text-muted-foreground">Code expires in: {formatTime(timeLeft)}</p>}
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email<span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" placeholder="email@halo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!validationErrors.email} className={validationErrors.email ? "!border-destructive !ring-destructive" : ""} />
              {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Reset Code<span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="0000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCode(value);
                }}
                aria-invalid={!!validationErrors.code}
                className={`text-center text-lg tracking-widest ${validationErrors.code ? "!border-destructive !ring-destructive" : ""}`}
                maxLength={4}
              />
              {validationErrors.code && <p className="text-xs text-destructive">{validationErrors.code}</p>}
            </div>

            <div className="space-y-6">
              <Button type="submit" className="w-full" disabled={isLoading || timeLeft === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Reset your password</h2>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              New Password<span className="text-destructive">*</span>
            </Label>
            <Input id="newPassword" type="password" placeholder="********" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} aria-invalid={!!validationErrors.newPassword} className={validationErrors.newPassword ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.newPassword && <p className="text-xs text-destructive">{validationErrors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password<span className="text-destructive">*</span>
            </Label>
            <Input id="confirmPassword" type="password" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={!!validationErrors.confirmPassword} className={validationErrors.confirmPassword ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.confirmPassword && <p className="text-xs text-destructive">{validationErrors.confirmPassword}</p>}
          </div>

          <div className="space-y-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
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
