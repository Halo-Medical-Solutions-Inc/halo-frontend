import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { specialties } from "@/store/types";
import { useDispatch } from "react-redux";
import useWebSocket from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";
import { setUser } from "@/store/slices/userSlice";
import { Loader2 } from "lucide-react";
import { apiVerifyEMRIntegration } from "@/store/api";

export default function AccountComponent() {
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const user = useSelector((state: RootState) => state.user.user);
  const templates = useSelector((state: RootState) => state.template.templates);
  const session = useSelector((state: RootState) => state.session.session);

  const [isSavingEMR, setIsSavingEMR] = useState(false);
  const [isVerifiedEMR, setIsVerifiedEMR] = useState(user?.emr_integration?.verified || false);
  const [selectedEMR, setSelectedEMR] = useState<string | null>(null);
  const [emrCredentials, setEmrCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.emr_integration?.emr) {
      setSelectedEMR(user.emr_integration.emr);
      if (user.emr_integration.credentials) {
        const filteredCredentials = Object.fromEntries(Object.entries(user.emr_integration.credentials).filter(([_, value]) => value !== undefined)) as Record<string, string>;
        setEmrCredentials(filteredCredentials);
      }
      if (user.emr_integration.verified) {
        setIsVerifiedEMR(user.emr_integration.verified);
      }
    }
  }, [user?.emr_integration]);

  const handleEMRSelection = (emrName: string | null) => {
    if (emrName === selectedEMR) {
      setSelectedEMR(null);
      setEmrCredentials({});
    } else {
      setSelectedEMR(emrName);
      if (emrName === user?.emr_integration?.emr && user?.emr_integration?.credentials) {
        const filteredCredentials = Object.fromEntries(Object.entries(user.emr_integration.credentials).filter(([_, value]) => value !== undefined)) as Record<string, string>;
        setEmrCredentials(filteredCredentials);
      } else {
        setEmrCredentials({});
      }
    }
  };

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUser({ ...user, name: e.target.value }));
    debouncedSend({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        name: e.target.value,
      },
    });
  };

  const selectSpecialty = (value: string) => {
    dispatch(setUser({ ...user, user_specialty: value }));
    send({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        user_specialty: value,
      },
    });
  };

  const selectDefaultTemplate = (value: string) => {
    dispatch(setUser({ ...user, default_template_id: value }));
    send({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        default_template_id: value,
      },
    });
  };

  const selectNoteGenerationQuality = (value: string) => {
    dispatch(setUser({ ...user, note_generation_quality: value }));
    send({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        note_generation_quality: value,
      },
    });
  };

  const selectDefaultLanguage = (value: string) => {
    dispatch(setUser({ ...user, default_language: value }));
    send({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        default_language: value,
      },
    });
  };

  const handleVerifyEMR = async () => {
    if (!selectedEMR) return;

    setIsSavingEMR(true);
    try {
      const updatedUser = await apiVerifyEMRIntegration(session.session_id, selectedEMR, emrCredentials);
      if (updatedUser?.emr_integration?.verified) {
        dispatch(setUser({ ...user, emr_integration: updatedUser.emr_integration }));
        setIsVerifiedEMR(true);
      } else {
        setIsVerifiedEMR(false);
      }
    } catch (error) {
      console.error("EMR verification failed:", error);
      setIsVerifiedEMR(false);
    } finally {
      setIsSavingEMR(false);
    }
  };

  const updateCredential = (key: string, value: string) => {
    setEmrCredentials({ ...emrCredentials, [key]: value });
  };

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">Account Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">Account Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
            <div className="space-y-2">
              <Label>
                Name<span className="text-destructive">*</span>
              </Label>
              <Input id="name" type="text" placeholder="John Doe" value={user?.name} onChange={(e) => nameChange(e)} />
            </div>

            <Label>
              Select specialty
              <span className="text-destructive" />
            </Label>
            <Select value={user?.user_specialty} onValueChange={(value) => selectSpecialty(value)}>
              <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                <SelectValue placeholder="Select a specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Specialties</SelectLabel>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.specialty_id} value={specialty.specialty_id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Label>Select default template</Label>
            <Select value={user?.default_template_id} onValueChange={(value) => selectDefaultTemplate(value)}>
              <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Templates</SelectLabel>
                  {templates.map((template) => (
                    <SelectItem key={template.template_id} value={template.template_id || ""}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Label>Note generation quality</Label>
            <Select value={user?.note_generation_quality || "BASIC"} onValueChange={(value) => selectNoteGenerationQuality(value)}>
              <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Quality Options</SelectLabel>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">Subscription Status</h2>
              <p className="text-sm text-muted-foreground">Your current subscription information.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${user?.subscription?.plan === "MONTHLY" || user?.subscription?.plan === "YEARLY" || user?.subscription?.plan === "CUSTOM" ? "border-success bg-success-foreground text-success" : user?.subscription?.plan === "FREE" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-destructive bg-destructive-foreground text-destructive"}`}>{user?.subscription?.plan === "MONTHLY" || user?.subscription?.plan === "YEARLY" || user?.subscription?.plan === "CUSTOM" ? "✓ Active" : user?.subscription?.plan === "FREE" ? "Free Trial" : "Inactive"}</div>

              {(user?.subscription?.plan === "MONTHLY" || user?.subscription?.plan === "YEARLY") && (
                <div className="flex items-center gap-2">
                  <p className="text-sm">{user.subscription.plan === "MONTHLY" ? "$250/month" : "$200/year"}</p>
                  <span className="text-xs text-muted-foreground">({user.subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"} Plan)</span>
                </div>
              )}

              {user?.subscription?.plan === "CUSTOM" && (
                <div className="flex items-center gap-2">
                  <p className="text-sm">Custom Plan</p>
                  <span className="text-xs text-muted-foreground">(Custom Pricing)</span>
                </div>
              )}

              {user?.subscription?.plan === "FREE" && user?.subscription?.free_trial_expiration_date && (
                <div className="flex items-center gap-2">
                  <p className="text-sm">Expires: {new Date(user.subscription.free_trial_expiration_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {(user?.subscription?.plan === "MONTHLY" || user?.subscription?.plan === "YEARLY" || user?.subscription?.plan === "CUSTOM") && (
              <p
                className="text-sm underline cursor-pointer text-muted-foreground hover:text-muted-foreground"
                onClick={() => {
                  const subject = encodeURIComponent("Subscription Cancellation Request");
                  const body = encodeURIComponent(
                    `Hello Halo Health Team,

I would like to request the cancellation of my subscription.

Account Details:
- Name: ${user?.name || "N/A"}
- Email: ${user?.email || "N/A"}
- Current Plan: ${user?.subscription?.plan || "N/A"}

Please process this cancellation request and confirm the cancellation date and any final billing information.

Thank you,
${user?.name || "User"}`
                  );
                  window.location.href = `mailto:keshav@halohealth.app?subject=${subject}&body=${body}`;
                }}
              >
                Request Cancellation
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">EMR Integration</h2>
              <p className="text-sm text-muted-foreground">Configure your EMR integration.</p>
            </div>

            {user?.subscription?.plan === "CUSTOM" ? (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Button variant={selectedEMR === "OFFICE_ALLY" ? "default" : "outline"} onClick={() => handleEMRSelection("OFFICE_ALLY")}>
                    Office Ally
                  </Button>
                  <Button variant={selectedEMR === "ADVANCEMD" ? "default" : "outline"} onClick={() => handleEMRSelection("ADVANCEMD")}>
                    AdvanceMD
                  </Button>
                </div>

                {selectedEMR && (
                  <div className="space-y-4">
                    {selectedEMR === "OFFICE_ALLY" && (
                      <>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input type="text" placeholder="Enter your Office Ally username" value={emrCredentials.username || ""} onChange={(e) => updateCredential("username", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" placeholder="Enter your Office Ally password" value={emrCredentials.password || ""} onChange={(e) => updateCredential("password", e.target.value)} />
                        </div>
                      </>
                    )}

                    {selectedEMR === "ADVANCEMD" && (
                      <>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input type="text" placeholder="Enter your username" value={emrCredentials.username || ""} onChange={(e) => updateCredential("username", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" placeholder="Enter your password" value={emrCredentials.password || ""} onChange={(e) => updateCredential("password", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Office Key</Label>
                          <Input type="text" placeholder="Enter your office key" value={emrCredentials.office_key || ""} onChange={(e) => updateCredential("office_key", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>App Name</Label>
                          <Input type="text" placeholder="Enter your app name" value={emrCredentials.app_name || ""} onChange={(e) => updateCredential("app_name", e.target.value)} />
                        </div>
                      </>
                    )}

                    {selectedEMR === user?.emr_integration?.emr && isVerifiedEMR ? (
                      <div className="flex items-center gap-2">
                        <Button onClick={handleVerifyEMR} disabled={isSavingEMR || (selectedEMR === "OFFICE_ALLY" && (!emrCredentials.username || !emrCredentials.password)) || (selectedEMR === "ADVANCEMD" && (!emrCredentials.username || !emrCredentials.password || !emrCredentials.office_key || !emrCredentials.app_name))}>
                          {isSavingEMR ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                        <div className="text-sm text-success">✓ This EMR integration is verified</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button onClick={handleVerifyEMR} disabled={isSavingEMR || (selectedEMR === "OFFICE_ALLY" && (!emrCredentials.username || !emrCredentials.password)) || (selectedEMR === "ADVANCEMD" && (!emrCredentials.username || !emrCredentials.password || !emrCredentials.office_key || !emrCredentials.app_name))}>
                          {isSavingEMR ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                        <div className="text-sm text-destructive">✗ This EMR integration is not verified</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 border bg-muted rounded-md border-border border rounded-lg">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Request EMR Integration</h3>
                    <p className="text-xs text-muted-foreground">EMR integrations are available with our custom plans. Contact us to discuss your specific EMR needs and get a tailored solution.</p>
                  </div>
                  <Button
                    variant="default"
                    className="w-fit"
                    onClick={() => {
                      const subject = encodeURIComponent("EMR Integration Request");
                      const body = encodeURIComponent(
                        `Hello Halo Health Team,

I would like to request EMR integration for my account.

Account Details:
- Name: ${user?.name || "N/A"}
- Email: ${user?.email || "N/A"}
- Current Plan: ${user?.subscription?.plan || "N/A"}
- Specialty: ${specialties.find((s) => s.specialty_id === user?.user_specialty)?.name || "N/A"}

EMR Information:
- EMR System: [Please specify which EMR system you use]
- Practice Size: [Please specify number of providers/locations]
- Integration Requirements: [Please describe your specific integration needs]

Please contact me to discuss custom plan options and EMR integration setup.

Thank you,
${user?.name || "User"}`
                      );
                      window.location.href = `mailto:keshav@halohealth.app?subject=${subject}&body=${body}`;
                    }}
                  >
                    Contact Us for Integration
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
