"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExpandingTextarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedTemplate, clearSelectedTemplate, setTemplates } from "@/store/slices/templateSlice";
import { setScreen } from "@/store/slices/sessionSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";
import { Template } from "@/store/types";

export default function TemplateComponent() {
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const session = useSelector((state: RootState) => state.session.session);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);
  const templates = useSelector((state: RootState) => state.template.templates);

  useEffect(() => {
    handle("create_template", "template", (data) => {
      if (data.was_requested) {
        dispatch(setTemplates(templates.map((template: Template) => (template._id === selectedTemplate?._id ? (data.data as Template) : template))));
        dispatch(clearSelectedTemplate());
        dispatch(setScreen("TEMPLATES"));
      }
    });

    handle("delete_template", "template", (data) => {
      if (selectedTemplate?._id === data.data.template_id) {
        dispatch(clearSelectedTemplate());
        dispatch(setScreen("TEMPLATES"));
      }
    });
  }, [selectedTemplate, templates]);

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, name: e.target.value }));
    debouncedSend({
      type: "update_template",
      session_id: session._id,
      data: {
        _id: selectedTemplate?._id,
        name: e.target.value,
      },
    });
  };
  const instructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, instructions: e.target.value }));
    debouncedSend({
      type: "update_template",
      session_id: session._id,
      data: {
        _id: selectedTemplate?._id,
        instructions: e.target.value,
      },
    });
  };

  const deleteTemplate = () => {
    setIsDeletingTemplate(true);
    send({
      type: "delete_template",
      session_id: session._id,
      data: {
        template_id: selectedTemplate?._id,
      },
    });
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
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive hover:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
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
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteTemplate();
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
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
              <Input value={selectedTemplate?.name} onChange={nameChange} placeholder="New Template" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left" />
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
            value={selectedTemplate?.instructions}
            onChange={instructionsChange}
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
