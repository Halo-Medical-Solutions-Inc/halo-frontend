"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiVerifyEmail, apiResendVerification, apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { setTemplates } from "@/store/slices/templateSlice";
import { setVisits } from "@/store/slices/visitSlice";
import { setUser } from "@/store/slices/userSlice";

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      router.push("/signin");
      return;
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
  }, [sessionId, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!code.trim()) {
      errors.code = "Verification code is required";
    } else if (!/^\d{4}$/.test(code)) {
      errors.code = "Please enter a valid 4-digit code";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0 && sessionId) {
      setIsLoading(true);

      try {
        await apiVerifyEmail(sessionId, code);

        const session = { session_id: sessionId };
        dispatch(setSession(session));
        localStorage.setItem("session", JSON.stringify(session));

        const user = await apiGetUser(sessionId);
        dispatch(setUser(user));

        const templates = await apiGetUserTemplates(sessionId);
        dispatch(setTemplates(templates));

        const visits = await apiGetUserVisits(sessionId);
        dispatch(setVisits(visits));

        router.push("/dashboard");
      } catch (err: any) {
        setValidationErrors({
          code: "Invalid or expired verification code",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (!sessionId) return;

    setIsResending(true);
    try {
      await apiResendVerification(sessionId);
      setTimeLeft(3600);
      setValidationErrors({});
    } catch (err: any) {
      setValidationErrors({
        code: "Failed to resend verification code",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Verify your email</h2>
            <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to your email address</p>
            {timeLeft > 0 && <p className="text-xs text-muted-foreground">Code expires in: {formatTime(timeLeft)}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Verification Code<span className="text-destructive">*</span>
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
                "Verify Email"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending || timeLeft > 3540}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
              {timeLeft > 3540 && <p className="text-xs text-muted-foreground">You can request a new code in {formatTime(timeLeft - 3540)}</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
