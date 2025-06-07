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
import { CheckCircle, Loader2, Mic, MicOff, MoreHorizontal, PauseCircle, PlayCircle, Plus, Trash2, WifiOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { AudioVisualizer } from "./ui/audio-visualizer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import { useDispatch } from "react-redux";
import useWebSocket, { connected, handle, online, useConnectionStatus } from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";
import { useTranscriber } from "@/lib/transcriber";
import { useNextStep } from "nextstepjs";
import Confetti from "react-confetti";

export default function RecordComponent() {
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);
  const { online, connected: websocketConnected } = useConnectionStatus();

  const session = useSelector((state: RootState) => state.session.session);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);

  const { startTranscriber, stopTranscriber, connected: transcriberConnected, microphone } = useTranscriber(selectedVisit?.visit_id);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isAdditionalContextFocused, setIsAdditionalContextFocused] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);

  const [startRecordingLoading, setStartRecordingLoading] = useState(false);
  const [pauseRecordingLoading, setPauseRecordingLoading] = useState(false);
  const [resumeRecordingLoading, setResumeRecordingLoading] = useState(false);
  const [finishRecordingLoading, setFinishRecordingLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const { currentTour, setCurrentStep, closeNextStep } = useNextStep();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: typeof window !== "undefined" ? window.innerWidth : 0, height: typeof window !== "undefined" ? window.innerHeight : 0 });

  useEffect(() => {
    const deleteVisitHandler = handle("delete_visit", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_visit in record");
        setIsDeletingVisit(false);
      }
    });

    const startRecordingHandler = handle("start_recording", "record", async (data) => {
      if (data.was_requested) {
        console.log("Processing start_recording in record");

        try {
          await startTranscriber();
        } catch (error) {
          console.error("Error starting transcriber:", error);
        }

        setStartRecordingLoading(false);
      }
    });

    const resumeRecordingHandler = handle("resume_recording", "record", async (data) => {
      if (data.was_requested) {
        console.log("Processing resume_recording in record");

        try {
          await startTranscriber();
        } catch (error) {
          console.error("Error resuming transcriber:", error);
        }

        setResumeRecordingLoading(false);
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "record", async (data) => {
      if (selectedVisit?.visit_id == data.data.visit_id) {
        await stopTranscriber();
      }

      if (data.was_requested) {
        console.log("Processing pause_recording in record");
        setPauseRecordingLoading(false);
      }
    });

    const finishRecordingHandler = handle("finish_recording", "record", async (data) => {
      if (selectedVisit?.visit_id == data.data.visit_id) {
        await stopTranscriber();
      }

      if (data.was_requested) {
        console.log("Processing finish_recording in record");
        setFinishRecordingLoading(false);
      }
    });

    return () => {
      deleteVisitHandler();
      startRecordingHandler();
      resumeRecordingHandler();
      pauseRecordingHandler();
      finishRecordingHandler();
    };
  }, [selectedVisit?.visit_id, startTranscriber, stopTranscriber]);

  useEffect(() => {
    if (selectedVisit?.additional_context?.trim() !== "") {
      setIsAdditionalContextFocused(true);
      return;
    }
    if (isAdditionalContextFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdditionalContextFocused, selectedVisit?.additional_context]);

  useEffect(() => {
    if (selectedVisit?.additional_context?.trim() === "") {
      setIsAdditionalContextFocused(false);
      return;
    }
  }, [selectedVisit]);

  useEffect(() => {
    if (selectedVisit?.status !== "RECORDING") {
      setRecordingDuration(selectedVisit?.recording_duration || 0);
    }
  }, [selectedVisit?.recording_duration, selectedVisit?.status]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (selectedVisit?.status === "RECORDING") {
      intervalId = setInterval(() => {
        setRecordingDuration((prev) => Number(prev) + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedVisit?.status]);

  useEffect(() => {
    if (selectedVisit?.status === "RECORDING" && (!connected || !online || !websocketConnected)) {
      dispatch(setSelectedVisit({ ...selectedVisit, status: "PAUSED" }));

      stopTranscriber();

      send({
        type: "pause_recording",
        session_id: session.session_id,
        data: {
          visit_id: selectedVisit?.visit_id,
        },
      });
    }
  }, [connected, selectedVisit?.status]);

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

  useEffect(() => {
    return () => {
      stopTranscriber();
    };
  }, [stopTranscriber]);

  useEffect(() => {
    if (selectedVisit && nameInputRef.current) {
      const visitName = selectedVisit.name?.trim();
      if (!visitName || visitName === "New Visit") {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }
  }, [selectedVisit?.visit_id]);

  useEffect(() => {
    if (recordingDuration === 5400 && selectedVisit?.status === "RECORDING") {
      pauseRecording();
      send({
        type: "update_visit",
        session_id: session.session_id,
        data: {
          visit_id: selectedVisit?.visit_id,
          recording_duration: 5401,
        },
      });
    }
  }, [recordingDuration]);

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, name: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        name: e.target.value,
      },
    });

    if (e.target.value.trim() === "Alex Patient" && currentTour === "visit-tour") {
      setCurrentStep(2);
    }
  };

  const additionalContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, additional_context: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        additional_context: e.target.value,
      },
    });
  };

  const selectTemplate = (value: string) => {
    dispatch(setSelectedVisit({ ...selectedVisit, template_id: value }));
    send({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        template_id: value,
      },
    });

    if (templates.find((template) => template.template_id === value)?.name === "H&P" && currentTour === "visit-tour") {
      setCurrentStep(3);
    }
  };

  const selectLanguage = (value: string) => {
    dispatch(setSelectedVisit({ ...selectedVisit, language: value }));
    send({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        language: value,
      },
    });
  };

  const deleteVisit = () => {
    setIsDeletingVisit(true);
    send({
      type: "delete_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });
  };

  const startRecording = async () => {
    setStartRecordingLoading(true);

    const errors: Record<string, string> = !selectedVisit?.template_id || !templates.some((template) => template.template_id === selectedVisit.template_id) ? { template: "Please select a template" } : {};
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStartRecordingLoading(false);
      return;
    }

    if (!microphone) {
      console.error("Microphone not available");
      setStartRecordingLoading(false);
      return;
    }

    send({
      type: "start_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });

    if (currentTour === "visit-tour") {
      setCurrentStep(4);
    }
  };

  const pauseRecording = () => {
    setPauseRecordingLoading(true);

    send({
      type: "pause_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });
  };

  const resumeRecording = async () => {
    setResumeRecordingLoading(true);

    send({
      type: "resume_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });
  };

  const finishRecording = () => {
    setFinishRecordingLoading(true);

    if (currentTour === "visit-tour") {
      closeNextStep();
      setShowConfetti(true);

      setTimeout(() => {
        send({
          type: "finish_recording",
          session_id: session.session_id,
          data: {
            visit_id: selectedVisit?.visit_id,
          },
        });
      }, 3000);
    } else {
      send({
        type: "finish_recording",
        session_id: session.session_id,
        data: {
          visit_id: selectedVisit?.visit_id,
        },
      });
    }
  };

  return (
    <>
      {selectedVisit?.status === "RECORDING" && <div className="fixed inset-0 bg-background/10 backdrop-blur-[4px] z-40" style={{ pointerEvents: "all" }} />}
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} gravity={0.3} />}
      <SidebarInset className="overflow-visible h-auto max-h-none">
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
                <span className="font-normal text-muted-foreground md:inline-block">{recordingDuration ? recordingDuration + " seconds" : "Not started"}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto">
                    <AlertDialog key={selectedVisit?.visit_id}>
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
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteVisit();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeletingVisit}
                          >
                            {isDeletingVisit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
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
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 relative ${selectedVisit?.status === "RECORDING" ? "z-50" : ""}`}>
          <div className="mx-auto w-[320px] max-w-3xl rounded-xl space-y-4" id="visit-tour-natural-finish">
            <div className="relative group flex justify-center items-center">
              <Input value={selectedVisit?.name} onChange={nameChange} placeholder="New Visit" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-center" id="visit-tour-name-patient" ref={nameInputRef} />
            </div>

            <div className="flex items-center justify-between w-full" id="visit-tour-select-template">
              <Label className="text-sm font-normal text-muted-foreground">
                Select template
                <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedVisit?.template_id} onValueChange={selectTemplate} disabled={selectedVisit?.status === "RECORDING" || selectedVisit?.status === "PAUSED"}>
                <SelectTrigger className={`min-w-[50px] max-w-[160px] w-auto ${validationErrors.template ? "!border-destructive !ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent align="end" style={{ zIndex: 9999 }}>
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

            {validationErrors.template && <p className="text-xs text-destructive">{validationErrors.template}</p>}

            {/* <div className="flex items-center justify-between w-full">
              <Label className="text-sm font-normal text-muted-foreground">
                Select language
                <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedVisit?.language} onValueChange={selectLanguage} disabled={selectedVisit?.status === "RECORDING" || selectedVisit?.status === "PAUSED"}>
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
            </div> */}

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
                <Textarea key={selectedVisit?.visit_id} placeholder="ex. 32 year old male with a history of hypertension and diabetes" className="w-full h-28 resize-none" value={selectedVisit?.additional_context} onChange={additionalContextChange} onFocus={() => setIsAdditionalContextFocused(true)} onBlur={() => (selectedVisit?.additional_context?.trim() ? setIsAdditionalContextFocused(true) : setIsAdditionalContextFocused(false))} ref={textareaRef} />
              </div>
            )}

            <Separator />

            <AudioVisualizer />

            {selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={finishRecording} disabled={!online || !websocketConnected}>
                  {finishRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Finish
                    </>
                  )}
                </Button>
                <Button className="flex-1" onClick={startRecording} id="visit-tour-start-recording" disabled={!online || !websocketConnected}>
                  {startRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mic className="h-4 w-4" /> Start
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedVisit?.status === "RECORDING" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1 border-destructive-border text-destructive hover:opacity-80 hover:text-destructive" onClick={pauseRecording} disabled={!online || !websocketConnected}>
                  {pauseRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <PauseCircle className="h-4 w-4 text-destructive" />{" "}
                      {recordingDuration
                        ? `${Math.floor(recordingDuration / 60)
                            .toString()
                            .padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}`
                        : "00:00"}
                    </>
                  )}
                </Button>
                <Button className="flex-1" onClick={finishRecording} disabled={!online || !websocketConnected}>
                  {finishRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Finish
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedVisit?.status === "PAUSED" && (
              <div className="flex items-center justify-between w-full gap-2">
                <Button variant="outline" className="flex-1 border-warning-border text-warning hover:opacity-80 hover:text-warning" onClick={resumeRecording} disabled={!online || !websocketConnected}>
                  {resumeRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 text-warning" />{" "}
                      {recordingDuration
                        ? `${Math.floor(recordingDuration / 60)
                            .toString()
                            .padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}`
                        : "00:00"}
                    </>
                  )}
                </Button>
                <Button className="flex-1" onClick={finishRecording} disabled={!online || !websocketConnected}>
                  {finishRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Finish
                    </>
                  )}
                </Button>
              </div>
            )}

            {!selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <Button className="w-full" onClick={startRecording} id="visit-tour-start-recording" disabled={!online || !websocketConnected}>
                {startRecordingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Start recording
                  </>
                )}
              </Button>
            )}

            {!online ||
              (!websocketConnected && (
                <div className="flex items-center justify-center w-full mt-3 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <WifiOff className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Recording may not be saved due to connectivity issues</span>
                </div>
              ))}

            {!microphone && (
              <div className="flex items-center justify-center w-full mt-3 p-3 bg-warning/10 text-warning rounded-md text-sm">
                <MicOff className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Microphone not available</span>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
