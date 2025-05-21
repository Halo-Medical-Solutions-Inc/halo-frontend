"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, ArrowLeft, Sparkles, Loader2, FileText, Printer, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExpandingTextarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedTemplate } from "@/store/slices/templateSlice";
import { setScreen } from "@/store/slices/sessionSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { useDebouncedSend, getTimeDifference } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function TemplateComponent() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const session = useSelector((state: RootState) => state.session.session);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);

  const [activeTab, setActiveTab] = useState<"instructions" | "printer">("instructions");
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  useEffect(() => {
    const deleteTemplateHandler = handle("delete_template", "template", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_template in template");
        setIsDeletingTemplate(false);
      }
    });

    return () => {
      deleteTemplateHandler();
    };
  }, []);

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, name: e.target.value }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        name: e.target.value,
      },
    });
  };
  const instructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, instructions: e.target.value }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        instructions: e.target.value,
      },
    });
  };

  const headerChange = (html: string) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, header: html }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        header: html,
      },
    });
  };

  const footerChange = (html: string) => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, footer: html }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        footer: html,
      },
    });
  };

  const deleteTemplate = () => {
    setIsDeletingTemplate(true);
    send({
      type: "delete_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
      },
    });
  };

  const polishTemplate = () => {};

  const handleInstructionsTabClick = () => {
    setActiveTab("instructions");
  };

  const handlePrinterTabClick = () => {
    setActiveTab("printer");
  };

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {!isMobile && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{selectedTemplate?.name || "New Template"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              {!isMobile && <span className="font-normal text-muted-foreground md:inline-block">Last saved {selectedTemplate?.modified_at ? getTimeDifference(selectedTemplate?.modified_at.replace(" ", "T") + "Z", new Date().toISOString()) : ""}</span>}
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
              {isMobile && (
                <Button variant="outline" size="icon" onClick={() => dispatch(setScreen("TEMPLATES"))}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={() => dispatch(setScreen("TEMPLATES"))}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button variant={activeTab === "instructions" ? "default" : "outline"} size="icon" onClick={handleInstructionsTabClick}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant={activeTab === "printer" ? "default" : "outline"} size="icon" onClick={handlePrinterTabClick}>
                  <Printer className="h-4 w-4" />
                </Button>

                {/* <Button onClick={polishTemplate}>
                <Sparkles className="h-4 w-4" />
                Polish
              </Button> */}
              </div>
            )}
          </div>
          <Separator className="my-2 bg-border h-[1px]" />

          {activeTab === "instructions" ? (
            <ExpandingTextarea
              minHeight={200}
              maxHeight={10000}
              value={selectedTemplate?.instructions}
              onChange={instructionsChange}
              placeholder={`Create or insert you're EMR template here
- Use ##Title Name## to define sections.
- {Use curly braces} for providing AI instructions.
- For Epic users, Halo recognizes your @smartlinks@.`}
              className="w-full text-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none"
            />
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Header</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>HTML support enabled</span>
                  </div>
                </div>
                <div className="rounded-md bg-muted/20">
                  <RichTextEditor content={selectedTemplate?.header || ""} onChange={headerChange} minHeight={100} placeholder="Add your header content here" />
                </div>
                <p className="text-xs text-muted-foreground">Add HTML content for the document header. This will appear at the top of printed documents.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Footer</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>HTML support enabled</span>
                  </div>
                </div>
                <div className="rounded-md bg-muted/20">
                  <RichTextEditor content={selectedTemplate?.footer || ""} onChange={footerChange} minHeight={100} placeholder="Add your footer content here" />
                </div>
                <p className="text-xs text-muted-foreground">Add HTML content for the document footer. This will appear at the bottom of printed documents.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}
