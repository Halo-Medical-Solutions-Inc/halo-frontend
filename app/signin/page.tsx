"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits, apiSigninUser, apiCheckSubscription } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { setTemplates } from "@/store/slices/templateSlice";
import { setVisits } from "@/store/slices/visitSlice";
import { setUser } from "@/store/slices/userSlice";

const carouselItems = [
  {
    gif: "/gif1.gif",
    title: "Create an Encounter",
    subtitle: "Select from a variety of pre-built or custom templates. Halo supports 99+ languages."
  },
  {
    gif: "/gif2.gif",
    title: "Generate Chart Note",
    subtitle: "Generate comprehensive notes in under 60 seconds."
  },
  {
    gif: "/gif3.gif",
    title: "Send to Your EMR",
    subtitle: "Easily transfer the note to your EMR system."
  },
  {
    gif: "/gif4.webp",
    title: "Instant Coding for Faster Billing",
    subtitle: "Automated ICD-10 and CPT suggestions help doctors bill accurately and get paid faster."
  },
  {
    gif: "/gif5.webp",
    title: "Custom Templates Tailored to Your EMR",
    subtitle: "Import existing templates or create new ones that match your workflow."
  }
];

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showMobileCarousel, setShowMobileCarousel] = useState(false);

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
              const subscriptionResponse = await apiCheckSubscription(user.user_id!);
              const { has_active_subscription } = subscriptionResponse;

              if (!has_active_subscription && user.subscription?.plan !== "CUSTOM") {
                // Redirect to payment page (skip for CUSTOM plan users)
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center">
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

      {/* Desktop Carousel */}
      <div className="bg-muted relative hidden lg:flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          {/* Slideshow Container with Fade Effects */}
          <div className="relative w-full">
            {/* Left Fade */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted to-transparent z-10 pointer-events-none" />
            
            {/* Right Fade */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted to-transparent z-10 pointer-events-none" />
            
            {/* Scrollable Container */}
            <div className="overflow-x-auto px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-8 px-24">
                {carouselItems.map((item, index) => (
                  <div key={index} className="flex-shrink-0 w-[400px]">
                    <div className="space-y-4">
                      {/* Image with Border */}
                      <div className="aspect-[4/3] bg-background rounded-2xl overflow-hidden border-[10px] border-black">
                        <img 
                          src={item.gif} 
                          alt={item.title}
                          className={`w-full h-full ${
                            index === 0 ? "object-contain -translate-y-[6px]" :
                            index === 1 ? "object-contain -translate-y-[10px] scale-110" :
                            index === 2 ? "h-full w-auto object-cover object-left" :
                            index === 3 ? "object-contain -translate-y-[18px]" :
                            index === 4 ? "object-contain" :
                            "object-contain"
                          }`}
                        />
                      </div>
                      
                      {/* Title and Subtitle */}
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Carousel */}
      <div 
        className={`lg:hidden bg-muted transition-all duration-500 ease-in-out overflow-hidden ${
          showMobileCarousel ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="relative h-full">
          {/* Top Fade */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-muted to-transparent z-10 pointer-events-none" />
          
          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable Container */}
          <div className="overflow-y-auto h-screen py-16 px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-col gap-12">
              {carouselItems.map((item, index) => (
                <div key={index} className="w-full max-w-sm mx-auto">
                  <div className="space-y-4">
                    {/* Image with Border */}
                    <div className="aspect-[4/3] bg-background rounded-2xl overflow-hidden border-[8px] border-black">
                      <img 
                        src={item.gif} 
                        alt={item.title}
                        className={`w-full h-full ${
                          index === 0 ? "object-contain -translate-y-[6px]" :
                          index === 1 ? "object-contain -translate-y-[10px] scale-110" :
                          index === 2 ? "h-full w-auto object-cover object-left" :
                          index === 3 ? "object-contain -translate-y-[18px]" :
                          index === 4 ? "object-contain" :
                          "object-contain"
                        }`}
                      />
                    </div>
                    
                    {/* Title and Subtitle */}
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile "Learn More" Button - Fixed at bottom of screen */}
      <button
        onClick={() => setShowMobileCarousel(!showMobileCarousel)}
        className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full shadow-lg animate-pulse hover:animate-none transition-all duration-300 hover:scale-105 z-50"
        aria-label={showMobileCarousel ? "Hide features" : "Learn more about features"}
      >
        <span className="text-xs font-medium">Learn more</span>
        <ChevronDown 
          className={`h-3 w-3 transition-transform duration-300 ${
            showMobileCarousel ? 'rotate-180' : ''
          }`} 
        />
      </button>
    </div>
  );
}
