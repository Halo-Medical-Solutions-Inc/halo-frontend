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
import { languages } from "@/store/types";
import { useDispatch } from "react-redux";

export default function AccountComponent() {
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user.user);
  const templates = useSelector((state: RootState) => state.template.templates);

  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [speciality, setSpeciality] = useState("");
  const [defaultTemplateId, setDefaultTemplateId] = useState(user?.default_template_id);
  const [defaultLanguage, setDefaultLanguage] = useState(user?.default_language);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(user?.name);
    setValidationErrors({ ...validationErrors, name: "" });
  }, [user?.name]);

  useEffect(() => {
    setEmail(user?.email);
    setValidationErrors({ ...validationErrors, email: "" });
  }, [user?.email]);

  useEffect(() => {
    setDefaultTemplateId(user?.default_template_id);
    setValidationErrors({ ...validationErrors, defaultTemplate: "" });
  }, [user?.default_template_id]);

  useEffect(() => {
    setDefaultLanguage(user?.default_language);
    setValidationErrors({ ...validationErrors, defaultLanguage: "" });
  }, [user?.default_language]);

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
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className={validationErrors.name ? "!border-destructive !ring-destructive" : ""} />
              {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
            </div>

            {/* <div className="space-y-2">
              <Label>
                Email<span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" placeholder="email@halo.com" value={email} onChange={(e) => setEmail(e.target.value)} className={validationErrors.email ? "!border-destructive !ring-destructive" : ""} />
              {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
            </div> */}
            <Label>
              Select speciality
              <span className="text-destructive" />
            </Label>
            <Select value={speciality} onValueChange={(value) => setSpeciality(value)}>
              <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                <SelectValue placeholder="Select a speciality" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Specialities</SelectLabel>
                  <SelectItem value="speciality1">Orthopedics</SelectItem>
                  <SelectItem value="speciality2">Neurosurgery</SelectItem>
                  <SelectItem value="speciality3">Cardiology</SelectItem>
                  <SelectItem value="speciality4">Rheumatology</SelectItem>
                  <SelectItem value="speciality5">Pediatrics</SelectItem>
                  <SelectItem value="speciality6">Urology</SelectItem>
                  <SelectItem value="speciality7">Dermatology</SelectItem>
                  <SelectItem value="speciality8">Endocrinology</SelectItem>
                  <SelectItem value="speciality9">Gastroenterology</SelectItem>
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
              <Select value={defaultTemplateId} onValueChange={(value) => setDefaultTemplateId(value)}>
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
              <Select value={defaultLanguage} onValueChange={(value) => setDefaultLanguage(value)}>
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
