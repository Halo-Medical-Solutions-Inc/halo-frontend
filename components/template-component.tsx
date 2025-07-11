"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, ArrowLeft, Sparkles, Loader2, FileText, Printer, Info, Settings } from "lucide-react";
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
import { useNextStep } from "nextstepjs";
import Confetti from "react-confetti";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function TemplateComponent() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);
  const { setCurrentStep, currentTour } = useNextStep();

  const session = useSelector((state: RootState) => state.session.session);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);

  const [activeTab, setActiveTab] = useState<"instructions" | "printer">("instructions");
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [headerSizeWarning, setHeaderSizeWarning] = useState(false);
  const [footerSizeWarning, setFooterSizeWarning] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: typeof window !== "undefined" ? window.innerWidth : 0, height: typeof window !== "undefined" ? window.innerHeight : 0 });

  const [fontSize, setFontSize] = useState("12px");
  const [fontFamily, setFontFamily] = useState("Times New Roman");

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

  useEffect(() => {
    const styles = parsePrintStyles(selectedTemplate?.print);
    setFontSize(styles.fontSize);
    setFontFamily(styles.fontFamily);
  }, [selectedTemplate?.template_id]);

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

    if (currentTour === "template-tour" && e.target.value.includes("FINISHED")) {
      setCurrentStep(2);
    }
  };

  const headerChange = (html: string) => {
    const sizeInBytes = new Blob([html]).size;
    const sizeInKB = sizeInBytes / 1024;

    setHeaderSizeWarning(sizeInKB > 500);

    if (sizeInKB > 1024) {
      console.warn(`Header content is large: ${sizeInKB.toFixed(2)}KB. This may cause issues.`);
    }

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
    const sizeInBytes = new Blob([html]).size;
    const sizeInKB = sizeInBytes / 1024;

    setFooterSizeWarning(sizeInKB > 500);

    if (sizeInKB > 1024) {
      console.warn(`Footer content is large: ${sizeInKB.toFixed(2)}KB. This may cause issues.`);
    }

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

  const polishTemplate = () => {
    dispatch(setSelectedTemplate({ ...selectedTemplate, status: "GENERATING_TEMPLATE" }));

    send({
      type: "polish_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
      },
    });

    if (currentTour === "template-tour") {
      setCurrentStep(3);
      setShowConfetti(true);
    }
  };

  const handleInstructionsTabClick = () => {
    setActiveTab("instructions");
  };

  const handlePrinterTabClick = () => {
    setActiveTab("printer");
  };

  const handleSettingsToggle = () => {
    setActiveTab(activeTab === "instructions" ? "printer" : "instructions");
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const parsePrintStyles = (print?: string): { fontSize: string; fontFamily: string } => {
    const defaultStyles = { fontSize: "12px", fontFamily: "Times New Roman" };
    if (!print) return defaultStyles;

    const styles = { ...defaultStyles };
    const parts = print.split(";").filter(Boolean);

    parts.forEach((part) => {
      const [key, value] = part.split(":").map((s) => s.trim());
      if (key === "font-size") {
        styles.fontSize = value;
      } else if (key === "font-family") {
        styles.fontFamily = value;
      }
    });

    return styles;
  };

  const buildPrintString = (fontSize: string, fontFamily: string): string => {
    return `font-size:${fontSize};font-family:${fontFamily}`;
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    const printString = buildPrintString(value, fontFamily);
    dispatch(setSelectedTemplate({ ...selectedTemplate, print: printString }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        print: printString,
      },
    });
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    const printString = buildPrintString(fontSize, value);
    dispatch(setSelectedTemplate({ ...selectedTemplate, print: printString }));
    debouncedSend({
      type: "update_template",
      session_id: session.session_id,
      data: {
        template_id: selectedTemplate?.template_id,
        print: printString,
      },
    });
  };

  return (
    <>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} gravity={0.3} />}
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
                  <Button onClick={polishTemplate} disabled={activeTab === "printer"} className={activeTab === "printer" ? "cursor-not-allowed" : ""} id="template-tour-polish-button">
                    {selectedTemplate?.status === "GENERATING_TEMPLATE" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Polish
                      </>
                    )}
                  </Button>
                  <Button variant={activeTab === "printer" ? "default" : "secondary"} size="icon" onClick={handleSettingsToggle}>
                    <Settings className="h-4 w-4" />
                  </Button>
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
                id="template-tour-content-textarea"
              />
            ) : activeTab === "printer" ? (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Font Size</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>Set the font size for the printed document.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={fontSize} onValueChange={handleFontSizeChange}>
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10px">10px</SelectItem>
                        <SelectItem value="12px">12px</SelectItem>
                        <SelectItem value="14px">14px</SelectItem>
                        <SelectItem value="16px">16px</SelectItem>
                        <SelectItem value="18px">18px</SelectItem>
                        <SelectItem value="20px">20px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Font Family</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>Set the font family for the printed document.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Select Font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Calibri">Calibri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Header</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>HTML support enabled</span>
                    </div>
                    {headerSizeWarning && (
                      <div className="text-xs text-orange-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        <span>Large content - images may not display properly</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/20">
                    <RichTextEditor content={selectedTemplate?.header || ""} onChange={headerChange} minHeight={100} placeholder="Add your header content here" />
                  </div>
                  <p className="text-xs text-muted-foreground">Add HTML content for the document header. This will appear at the top of printed documents. For best results, keep images under 800x800 pixels.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Footer</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>HTML support enabled</span>
                    </div>
                    {footerSizeWarning && (
                      <div className="text-xs text-orange-500 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        <span>Large content - images may not display properly</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/20">
                    <RichTextEditor content={selectedTemplate?.footer || ""} onChange={footerChange} minHeight={100} placeholder="Add your footer content here" />
                  </div>
                  <p className="text-xs text-muted-foreground">Add HTML content for the document footer. This will appear at the bottom of printed documents. For best results, keep images under 800x800 pixels.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
