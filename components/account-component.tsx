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
import { languages, specialties } from "@/store/types";
import { useDispatch } from "react-redux";
import useWebSocket, { handle } from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";
import { setUser } from "@/store/slices/userSlice";

export default function AccountComponent() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const templates = useSelector((state: RootState) => state.template.templates);
  const session = useSelector((state: RootState) => state.session.session);
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

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

  const saveAccount = () => {
    //TODO: Implement save account
  };

  const saveDefault = () => {
    //TODO: Implement save default
  };
  
  const savePassword = () => {
    //TODO: Implement save password
  };

  const deleteAccount = () => {
    //TODO: Implement delete account
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

            {/* <div className="space-y-2">
              <Label>
                Email<span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" placeholder="email@halo.com" value={email} onChange={(e) => setEmail(e.target.value)} className={validationErrors.email ? "!border-destructive !ring-destructive" : ""} />
              {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
            </div> */}
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

            <div className="flex items-center gap-2">
              <Button type="submit" onClick={saveAccount}>
                Save Changes
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">Advanced Settings</h2>
              <p className="text-sm text-muted-foreground">Configure detailed account preferences and security options.</p>
            </div>
            <div className="space-y-2">
              <Label>
                Default template
                <span className="text-destructive" />
              </Label>
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
            </div>

            <div className="space-y-2">
              <Label>
                Default language
                <span className="text-destructive" />
              </Label>
              <Select value={user?.default_language} onValueChange={(value) => selectDefaultLanguage(value)}>
                <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Languages</SelectLabel>
                    {languages.map((lang) => (
                      <SelectItem key={lang.language_id} value={lang.language_id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" onClick={saveDefault}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
