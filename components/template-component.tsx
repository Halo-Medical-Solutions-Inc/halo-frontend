"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExpandingTextarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedTemplate } from "@/store/slices/templateSlice";
import { setScreen } from "@/store/slices/sessionSlice";
export default function TemplateComponent() {
  const dispatch = useDispatch();

  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);

  const [name, setName] = useState(selectedTemplate?.name);
  const [instructions, setInstructions] = useState(selectedTemplate?.instructions);

  useEffect(() => {
    setName(selectedTemplate?.name);
  }, [selectedTemplate?.name]);

  useEffect(() => {
    setInstructions(selectedTemplate?.instructions);
  }, [selectedTemplate?.instructions]);

  useEffect(() => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, name, instructions }));
  }, [name, instructions]);

  const deleteTemplate = () => {
    // TODO: Implement delete template
  };

  const polishTemplate = () => {
    // TODO: Implement polish template
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
                <BreadcrumbPage className="line-clamp-1">{selectedTemplate?.name || "New Template"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-normal text-muted-foreground md:inline-block">
                Last saved{" "}
                {selectedTemplate?.modified_at
                  ? (() => {
                      const now = new Date();
                      const modified = new Date(selectedTemplate?.modified_at);
                      const diffMs = now.getTime() - modified.getTime();
                      const diffMinutes = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      const diffMonths = (now.getFullYear() - modified.getFullYear()) * 12 + now.getMonth() - modified.getMonth();
                      const diffYears = now.getFullYear() - modified.getFullYear();

                      if (diffMinutes === 0) return "now";
                      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
                      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
                      if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
                      if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
                      return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
                    })()
                  : ""}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto" align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span>Delete Template</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the template. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
            <div className="flex items-center gap-2 w-full">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Template" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={() => dispatch(setScreen("TEMPLATES"))}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button>
                <Sparkles className="h-4 w-4" />
                Polish
              </Button>
            </div>
          </div>
          <Separator className="my-2 bg-border h-[1px]" />
          <ExpandingTextarea
            minHeight={200}
            maxHeight={10000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={`Create or insert you're EMR template here
- Use ##Title Name## to define sections.
- {Use curly braces} for providing AI instructions.
- For Epic users, Halo recognizes your @smartlinks@.`}
            className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none"
          />
        </div>
      </div>
    </SidebarInset>
  );
}
