"use client";

import React, { useEffect, useState, useRef } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "./ui/textarea";
import { CheckCircle, Mic, MoreHorizontal, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { AudioVisualizer } from "./ui/audio-visualizer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { languages } from "@/store/types";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import { useDispatch } from "react-redux";
import { setScreen } from "@/store/slices/sessionSlice";

export default function RecordComponent() {
  const dispatch = useDispatch();
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);

  const [name, setName] = useState(selectedVisit?.name);
  const [templateId, setTemplateId] = useState(selectedVisit?.template_id);
  const [language, setLanguage] = useState(selectedVisit?.language);
  const [additionalContext, setAdditionalContext] = useState(selectedVisit?.additional_context);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAdditionalContextFocused, setIsAdditionalContextFocused] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(selectedVisit?.name);
  }, [selectedVisit?.name]);

  useEffect(() => {
    setTemplateId(selectedVisit?.template_id);
  }, [selectedVisit?.template_id]);

  useEffect(() => {
    setLanguage(selectedVisit?.language);
  }, [selectedVisit?.language]);

  useEffect(() => {
    setAdditionalContext(selectedVisit?.additional_context);
  }, [selectedVisit?.additional_context]);

  useEffect(() => {
    dispatch(setSelectedVisit({ ...selectedVisit, name, template_id: templateId, language, additional_context: additionalContext }));
  }, [name, templateId, language, additionalContext]);

  useEffect(() => {
    if (isAdditionalContextFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdditionalContextFocused]);

  const startRecording = () => {
    // TODO: Implement start recording
  };

  const pauseRecording = () => {
    // TODO: Implement pause recording
  };

  const resumeRecording = () => {
    // TODO: Implement resume recording
  };

  const finishRecording = () => {
    // TODO: Implement finish recording
  };

  return (
    <>
      {selectedVisit?.status === "RECORDING" && <div className="fixed inset-0 bg-background/10 backdrop-blur-[4px] z-40" style={{ pointerEvents: "all" }} />}
      <SidebarInset>
        <header className={`flex h-14 shrink-0 items-center gap-2 relative ${selectedVisit?.status === "RECORDING" ? "z-30" : "z-50"}`}>
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{selectedVisit?.name || "New Visit"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center">
                <span className="font-normal text-muted-foreground md:inline-block">{selectedVisit?.recording_duration || "Not started"}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>Delete Visit</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the visit. This action cannot be undone.</AlertDialogDescription>
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
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 relative ${selectedVisit?.status === "RECORDING" ? "z-50" : ""}`}>
          <div className="mx-auto w-[320px] max-w-3xl rounded-xl space-y-4">
            <div className="relative group flex justify-center items-center">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Visit" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-center" />
            </div>

            <div className="flex items-center justify-between w-full">
              <Label className="text-sm font-normal text-muted-foreground">
                Select template
                <span className="text-destructive">*</span>
              </Label>
              <Select value={templateId} onValueChange={(value) => setTemplateId(value)} disabled={selectedVisit?.status === "RECORDING" || selectedVisit?.status === "PAUSED"}>
                <SelectTrigger className={`min-w-[50px] max-w-[160px] w-auto ${validationErrors.template ? "!border-destructive !ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectLabel>Templates</SelectLabel>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id || ""}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {validationErrors.template && <p className="text-xs text-destructive">{validationErrors.template}</p>}

            <div className="flex items-center justify-between w-full">
              <Label className="text-sm font-normal text-muted-foreground">
                Select language
                <span className="text-destructive">*</span>
              </Label>
              <Select value={language} onValueChange={(value) => setLanguage(value)} disabled={selectedVisit?.status === "RECORDING" || selectedVisit?.status === "PAUSED"}>
                <SelectTrigger className="min-w-[50px] max-w-[160px] w-auto">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent align="end">
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

            {!isAdditionalContextFocused ? (
              <div className="flex items-center justify-between w-full">
                <Label className="text-sm font-normal text-muted-foreground">Additional context</Label>
                <Button className="min-w-[50px] max-w-[150px] w-auto" variant="outline" onClick={() => setIsAdditionalContextFocused(true)}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                <Label className="text-sm font-normal text-muted-foreground">Additional context</Label>
                <Textarea placeholder="ex. 32 year old male with a history of hypertension and diabetes" className="w-full h-28 resize-none" value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} onFocus={() => setIsAdditionalContextFocused(true)} onBlur={() => (additionalContext?.trim() ? setIsAdditionalContextFocused(true) : setIsAdditionalContextFocused(false))} ref={textareaRef} />
              </div>
            )}

            <Separator />

            <AudioVisualizer />

            {additionalContext?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={finishRecording}>
                  <CheckCircle className="h-4 w-4" />
                  Finish
                </Button>
                <Button className="flex-1" onClick={startRecording}>
                  <Mic className="h-4 w-4" />
                  Start
                </Button>
              </div>
            )}

            {selectedVisit?.status === "RECORDING" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1 border-destructive-border text-destructive hover:opacity-80 hover:text-destructive" onClick={pauseRecording}>
                  <PauseCircle className="h-4 w-4 text-destructive" />
                  00:32
                </Button>
                <Button className="flex-1" onClick={finishRecording}>
                  <CheckCircle className="h-4 w-4" />
                  Finish
                </Button>
              </div>
            )}

            {selectedVisit?.status === "PAUSED" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1 border-warning-border text-warning hover:opacity-80 hover:text-warning" onClick={resumeRecording}>
                  <PlayCircle className="h-4 w-4 text-warning" />
                  00:32
                </Button>
                <Button className="flex-1" onClick={finishRecording}>
                  <CheckCircle className="h-4 w-4" />
                  Finish
                </Button>
              </div>
            )}

            {!additionalContext?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <Button className="w-full" onClick={startRecording}>
                <Mic className="h-4 w-4" />
                Start recording
              </Button>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
