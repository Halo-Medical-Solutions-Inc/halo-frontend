"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits, apiSignupUser } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { setTemplates } from "@/store/slices/templateSlice";
import { setVisits } from "@/store/slices/visitSlice";
import { setUser } from "@/store/slices/userSlice";

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Full name is required";
    }

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
        const session = await apiSignupUser(name, email, password);

        if (session) {
          dispatch(setSession(session));
          localStorage.setItem("session", JSON.stringify(session));
          if (session.session_id) {
            apiGetUser(session.session_id).then((user) => {
              dispatch(setUser(user));
            });

            apiGetUserTemplates(session.session_id).then((templates) => {
              dispatch(setTemplates(templates));
            });

            apiGetUserVisits(session.session_id).then((visits) => {
              dispatch(setVisits(visits));
            });
          }
          router.push("/dashboard");
        }
      } catch (err: any) {
        setValidationErrors({
          email: "Failed to create account. Email may already be in use.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex md:items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Create an account</h2>
            <p className="text-sm text-muted-foreground">Sign up to your account to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full name<span className="text-destructive">*</span>
            </Label>
            <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!validationErrors.name} className={validationErrors.name ? "!border-destructive !ring-destructive" : ""} />
            {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
          </div>

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
                "Sign up"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
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
