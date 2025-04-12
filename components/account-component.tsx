import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function AccountComponent() {
  // Fake data
  const user = {
    name: "Dr. John Smith",
    email: "john.smith@halomedical.com",
    default_template_id: "template1",
    default_language: "en",
  };

  const templates = [
    { _id: "template1", name: "SOAP Note" },
    { _id: "template2", name: "Progress Note" },
    { _id: "template3", name: "Consultation" },
  ];

  const languages = [
    { language_id: "en", name: "English" },
    { language_id: "es", name: "Spanish" },
    { language_id: "fr", name: "French" },
  ];

  // Fake validation error for demonstration
  const emailError = "";
  const nameError = "";

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [defaultTemplate, setDefaultTemplate] = useState(
    user.default_template_id,
  );
  const [defaultLanguage, setDefaultLanguage] = useState(user.default_language);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  Account Settings
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">
                Account Information
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your personal information
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Name<span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={
                  nameError ? "!border-destructive !ring-destructive" : ""
                }
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Email<span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@halo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={
                  emailError ? "!border-destructive !ring-destructive" : ""
                }
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">
                Advanced Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure detailed account preferences and security options.
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Default template
                <span className="text-destructive" />
              </Label>
              <Select
                value={defaultTemplate}
                onValueChange={(value) => setDefaultTemplate(value)}
              >
                <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Templates</SelectLabel>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
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
              <Select
                value={defaultLanguage}
                onValueChange={(value) => setDefaultLanguage(value)}
              >
                <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Languages</SelectLabel>
                    {languages.map((lang) => (
                      <SelectItem
                        key={lang.language_id}
                        value={lang.language_id}
                      >
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Save</Button>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">Change Password</h2>
              <p className="text-sm text-muted-foreground">
                Update your password to keep your account secure.
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Current Password<span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="********"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                New Password<span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Retype Password<span className="text-destructive">*</span>
              </Label>
              <Input
                id="retypePassword"
                type="password"
                placeholder="********"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
              />
            </div>
            <Button type="submit">Update Password</Button>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive-border">
              <div className="flex items-center gap-2 p-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl md:text-xl font-bold">
                    Delete Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your Halo Account. Please note
                    that this action is irreversible, so proceed with caution.
                  </p>
                </div>
              </div>
              <div className="bg-destructive-secondary p-4 flex flex-row items-center justify-between rounded-b-lg">
                <p className="text-sm font-medium text-destructive">
                  This action cannot be undone!
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
