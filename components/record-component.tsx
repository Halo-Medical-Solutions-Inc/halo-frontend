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
import { CheckCircle, Loader2, Mic, MoreHorizontal, PauseCircle, PlayCircle, Plus, Trash2, WifiOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { AudioVisualizer } from "./ui/audio-visualizer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedVisit, setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch } from "react-redux";
import useWebSocket, { handle, useConnectionStatus } from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";
import { setScreen } from "@/store/slices/sessionSlice";
import { useIsMobile } from "@/hooks/use-mobile";

export default function RecordComponent() {
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);
  const isMobile = useIsMobile();
  const { online, connected } = useConnectionStatus();

  const session = useSelector((state: RootState) => state.session.session);
  const visits = useSelector((state: RootState) => state.visit.visits);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAdditionalContextFocused, setIsAdditionalContextFocused] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);

  const [startRecordingLoading, setStartRecordingLoading] = useState(false);
  const [pauseRecordingLoading, setPauseRecordingLoading] = useState(false);
  const [resumeRecordingLoading, setResumeRecordingLoading] = useState(false);
  const [finishRecordingLoading, setFinishRecordingLoading] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const isInternetConnectedRef = useRef<boolean>(navigator.onLine);

  useEffect(() => {
    const deleteVisitHandler = handle("delete_visit", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_visit in record");
        const filteredVisits = visits.filter((visit) => visit.visit_id !== data.data.visit_id);
        dispatch(setVisits(filteredVisits));

        if (filteredVisits.length > 0) {
          const lastVisit = filteredVisits[filteredVisits.length - 1];
          dispatch(setSelectedVisit(lastVisit));

          if (lastVisit.status === "FINISHED" || lastVisit.status === "GENERATING_NOTE") {
            dispatch(setScreen("NOTE"));
          } else {
            dispatch(setScreen("RECORD"));
          }
        }

        setIsDeletingVisit(false);
      } else {
        const filteredVisits = visits.filter((visit) => visit.visit_id !== data.data.visit_id);

        if (filteredVisits.length > 0) {
          const lastVisit = filteredVisits[filteredVisits.length - 1];
          dispatch(setSelectedVisit(lastVisit));

          if (lastVisit.status === "FINISHED" || lastVisit.status === "GENERATING_NOTE") {
            dispatch(setScreen("NOTE"));
          } else {
            dispatch(setScreen("RECORD"));
          }
        }
      }
    });

    const startRecordingHandler = handle("start_recording", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing start_recording in record");
        dispatch(setVisit(data.data));
        setStartRecordingLoading(false);
      }
    });

    const resumeRecordingHandler = handle("resume_recording", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing resume_recording in record");
        dispatch(setVisit(data.data));
        setResumeRecordingLoading(false);
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing pause_recording in record");
        dispatch(setVisit(data.data));
        setPauseRecordingLoading(false);
      }
    });

    const finishRecordingHandler = handle("finish_recording", "record", (data) => {
      if (data.was_requested) {
        console.log("Processing finish_recording in record");
        dispatch(setVisit({ ...data.data, status: "FRONTEND_TRANSITION" }));
        setFinishRecordingLoading(false);
        dispatch(setScreen("NOTE"));
      }
    });

    return () => {
      deleteVisitHandler();
      startRecordingHandler();
      resumeRecordingHandler();
      pauseRecordingHandler();
      finishRecordingHandler();
    };
  }, [visits]);

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
  };

  const startAudioProcessing = () => {
    try {
      console.log("Starting audio processing in record");
      if (!streamRef.current) return;

      audioContextRef.current = new AudioContext({
        sampleRate: 16000,
      });

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current.connect(audioContextRef.current.destination);

      console.log("Processor node connected in record");

      processorNodeRef.current.onaudioprocess = (e) => {
        console.log("Processing audio chunk in record");
        if (isRecordingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          const binary = new Uint8Array(pcmData.buffer);
          const base64 = btoa(binary.reduce((data, byte) => data + String.fromCharCode(byte), ""));
          send({
            type: "audio_chunk",
            session_id: session.session_id,
            data: { audio: base64 },
          });
        }
      };

      source.connect(processorNodeRef.current);
      console.log("Audio processing initialized");
    } catch (error) {
      console.error("Error initializing audio processing:", error);
      return;
    }
  };

  const stopAudioProcessing = () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
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

    const errors: Record<string, string> = !selectedVisit?.template_id ? { template: "Please select a template" } : {};
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    send({
      type: "start_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });

    isRecordingRef.current = true;

    startAudioProcessing();
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

    isRecordingRef.current = false;

    stopAudioProcessing();
  };

  const resumeRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    setResumeRecordingLoading(true);
    send({
      type: "resume_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });

    isRecordingRef.current = true;

    startAudioProcessing();
  };

  const finishRecording = () => {
    setFinishRecordingLoading(true);

    send({
      type: "finish_recording",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });

    isRecordingRef.current = false;

    stopAudioProcessing();
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (selectedVisit?.status === "RECORDING") {
      intervalId = setInterval(() => {
        const currentDuration = (selectedVisit.recording_duration || 0) + 1;

        dispatch(setSelectedVisit({ ...selectedVisit, recording_duration: currentDuration }));
        send({
          type: "update_visit",
          session_id: session.session_id,
          data: {
            visit_id: selectedVisit?.visit_id,
            recording_duration: currentDuration,
          },
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedVisit]);

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
                <BreadcrumbItem>{!isMobile && <BreadcrumbPage className="line-clamp-1">{selectedVisit?.name || "New Visit"}</BreadcrumbPage>}</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center">
                {!isMobile && (
                  <span className="font-normal text-muted-foreground md:inline-block">
                    {selectedVisit?.recording_duration
                      ? `${Math.floor(selectedVisit.recording_duration / 60)
                          .toString()
                          .padStart(2, "0")}:${(selectedVisit.recording_duration % 60).toString().padStart(2, "0")}`
                      : "Not started"}
                  </span>
                )}
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
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 px-4 sm:px-4 py-10 pb-16 sm:pb-10 relative ${selectedVisit?.status === "RECORDING" ? "z-50" : ""}`}>
          <div className="mx-auto w-[320px] max-w-3xl rounded-xl space-y-4 px-2 sm:px-0">
            <div className="relative group flex justify-center items-center">
              <Input value={selectedVisit?.name} onChange={nameChange} placeholder="New Visit" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-center" />
            </div>

            <div className="flex items-center justify-between w-full">
              <Label className="text-sm font-normal text-muted-foreground">
                Select template
                <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedVisit?.template_id} onValueChange={selectTemplate} disabled={selectedVisit?.status === "RECORDING" || selectedVisit?.status === "PAUSED"}>
                <SelectTrigger className={`min-w-[50px] max-w-[160px] w-auto ${validationErrors.template ? "!border-destructive !ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent align="end">
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

            {!selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <>
                <Button className="w-full" onClick={startRecording} disabled={!connected || !online}>
                  {startRecordingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mic className="h-4 w-4" /> Start recording
                    </>
                  )}
                </Button>
              </>
            )}

            {selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
              <>
                <div className="flex items-center justify-between w-full gap-2">
                  <Button variant="outline" className="flex-1" onClick={finishRecording} disabled={!online || !connected}>
                    {finishRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Finish
                      </>
                    )}
                  </Button>
                  <Button className="flex-1" onClick={startRecording} disabled={!online || !connected}>
                    {startRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mic className="h-4 w-4" /> Start
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {selectedVisit?.status === "RECORDING" && (
              <>
                <div className="flex items-center justify-between w-full gap-2">
                  <Button variant="outline" className="flex-1 border-destructive-border text-destructive hover:opacity-80 hover:text-destructive" onClick={pauseRecording}>
                    {pauseRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <PauseCircle className="h-4 w-4 text-destructive" />{" "}
                        {selectedVisit?.recording_duration
                          ? `${Math.floor(selectedVisit.recording_duration / 60)
                              .toString()
                              .padStart(2, "0")}:${(selectedVisit.recording_duration % 60).toString().padStart(2, "0")}`
                          : "00:00"}
                      </>
                    )}
                  </Button>
                  <Button className="flex-1" onClick={finishRecording} disabled={!online || !connected}>
                    {finishRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Finish
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {selectedVisit?.status === "PAUSED" && (
              <>
                <div className="flex items-center justify-between w-full gap-2">
                  <Button variant="outline" className="flex-1 border-warning-border text-warning hover:opacity-80 hover:text-warning" onClick={resumeRecording} disabled={!online || !connected}>
                    {resumeRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 text-warning" />{" "}
                        {selectedVisit?.recording_duration
                          ? `${Math.floor(selectedVisit.recording_duration / 60)
                              .toString()
                              .padStart(2, "0")}:${(selectedVisit.recording_duration % 60).toString().padStart(2, "0")}`
                          : "00:00"}
                      </>
                    )}
                  </Button>
                  <Button className="flex-1" onClick={finishRecording} disabled={!online || !connected}>
                    {finishRecordingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Finish
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {(!online || !connected) && (
              <div className="flex items-center justify-center w-full mt-3 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <WifiOff className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Recording may not be saved due to connectivity issues</span>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
