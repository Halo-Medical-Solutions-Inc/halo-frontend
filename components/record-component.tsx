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
import { CheckCircle, Mic, MoreHorizontal, PauseCircle, PlayCircle, Plus, Trash2, Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { AudioVisualizer } from "./ui/audio-visualizer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { languages } from "@/store/types";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import { useDispatch } from "react-redux";
import useWebSocket from "@/lib/websocket";
import { useDebouncedSend } from "@/lib/utils";

export default function RecordComponent() {
  const dispatch = useDispatch();
  const { send, handle, connect } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const session = useSelector((state: RootState) => state.session.session);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAdditionalContextFocused, setIsAdditionalContextFocused] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState("00:00");
  const [internetStatus, setInternetStatus] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected
  const [recordingMode, setRecordingMode] = useState<"realtime" | "buffering">("realtime");

  // Refs for managing audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processingBufferRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const recordingModeRef = useRef<"realtime" | "buffering">("realtime");
  const internetStatusRef = useRef<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    handle("start_recording", "recording", () => {
      dispatch(setSelectedVisit({ ...selectedVisit, status: "RECORDING" }));
    });
    handle("pause_recording", "recording", () => {
      dispatch(setSelectedVisit({ ...selectedVisit, status: "PAUSED" }));
    });
    handle("resume_recording", "recording", () => {
      dispatch(setSelectedVisit({ ...selectedVisit, status: "RECORDING" }));
    });
    handle("finish_recording", "recording", () => {
      dispatch(setSelectedVisit({ ...selectedVisit, status: "FINISHED" }));
    });
    handle("audio_chunk", "recording", (data) => {
      console.log("audio_chunk", data);
    });
  }, [selectedVisit]);

  // Monitor internet connection status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setInternetStatus(true);
      internetStatusRef.current = true;
      if (isRecordingRef.current && recordingModeRef.current === "buffering") {
        // When internet connection is restored, process any buffered audio
        processBufferedAudio().then(() => {
          // After processing buffer, switch back to realtime mode
          switchToRealtimeMode();
        });
      }
    };

    const handleOffline = () => {
      setInternetStatus(false);
      internetStatusRef.current = false;
      if (isRecordingRef.current && recordingModeRef.current === "realtime") {
        // Switch to buffering mode when internet connection is lost
        switchToBufferingMode();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Connect to websocket when component mounts
  useEffect(() => {
    if (session?._id) {
      connect(session._id);
    }

    return () => {
      // Clean up resources when component unmounts
      stopRecording();
    };
  }, [session]);

  // useEffect(() => {
  //   if (selectedVisit?.status === "RECORDING" && !recording) {
  //     startRecording();
  //   } else if ((selectedVisit?.status === "PAUSED" || selectedVisit?.status === "FINISHED") && recording) {
  //     stopRecording();
  //   }
  // }, [selectedVisit?.status]);

  // Update recording duration timer
  useEffect(() => {
    if (recording && recordingStartTimeRef.current) {
      const updateDuration = () => {
        if (!recordingStartTimeRef.current) return;

        const elapsed = Date.now() - recordingStartTimeRef.current;
        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / 1000 / 60) % 60);
        setRecordingDuration(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      };

      recordingTimerRef.current = setInterval(updateDuration, 1000);
      updateDuration();

      return () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
    }
  }, [recording]);

  // Initialize audio processing
  const initAudioProcessing = () => {
    try {
      if (!streamRef.current) return;

      // Create audio context with 16kHz sample rate
      audioContextRef.current = new AudioContext({
        sampleRate: 16000,
      });

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      // Create a script processor to handle raw audio data
      processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current.connect(audioContextRef.current.destination);

      processorNodeRef.current.onaudioprocess = (e) => {
        console.log("recording ref:", isRecordingRef.current);
        console.log("recordingMode ref:", recordingModeRef.current);
        console.log("internetStatus ref:", internetStatusRef.current);

        if (isRecordingRef.current && recordingModeRef.current === "realtime" && internetStatusRef.current) {
          // Get audio data
          const inputData = e.inputBuffer.getChannelData(0);
          console.log("Audio processing - buffer size:", inputData.length);

          // Convert float32 to int16 (linear16 encoding)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          // Convert to base64 for JSON transmission
          const base64 = arrayBufferToBase64(pcmData.buffer);
          console.log("Sending audio chunk - base64 length:", base64.length);

          // Send the audio data
          send({
            type: "audio_chunk",
            session_id: session._id,
            data: { audio: base64 },
          });
        }
      };

      // Connect the nodes
      source.connect(processorNodeRef.current);
      console.log("Audio processing initialized");
    } catch (error) {
      console.error("Error initializing audio processing:", error);

      // If failed to initialize audio processing, switch to buffering mode
      if (isRecordingRef.current) {
        switchToBufferingMode();
      }
    }
  };

  // Convert ArrayBuffer to base64 string
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const binary = new Uint8Array(buffer);
    return btoa(binary.reduce((data, byte) => data + String.fromCharCode(byte), ""));
  };

  // Start buffering recording when offline
  const startBufferingRecording = () => {
    try {
      setRecordingMode("buffering");
      recordingModeRef.current = "buffering";
      setConnectionStatus("disconnected");

      // Reset audio buffer
      audioBufferRef.current = [];

      if (!streamRef.current) return;

      // Clean up any existing audio context
      cleanupAudioContext();

      // Start MediaRecorder to buffer audio
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioBufferRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Media recorder stopped");
      };

      // Start recording in 1-second chunks
      mediaRecorder.start(1000);
      console.log("Started buffering audio");
    } catch (error) {
      console.error("Error starting buffering recording:", error);
    }
  };

  // Switch from real-time to buffering mode
  const switchToBufferingMode = () => {
    console.log("Switching to buffering mode");

    // Clean up real-time recording
    cleanupAudioContext();

    // Start buffering
    setRecordingMode("buffering");
    recordingModeRef.current = "buffering";
    startBufferingRecording();
  };

  // Switch from buffering to real-time mode
  const switchToRealtimeMode = () => {
    console.log("Switching to realtime mode");

    // Clean up buffering recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setRecordingMode("realtime");
    recordingModeRef.current = "realtime";

    // Initialize audio processing for real-time mode
    initAudioProcessing();
  };

  // Process buffered audio when internet connection is restored
  const processBufferedAudio = async () => {
    if (processingBufferRef.current || audioBufferRef.current.length === 0) {
      return;
    }

    try {
      processingBufferRef.current = true;
      console.log("Processing buffered audio");

      // Stop current MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      // Create a blob from all buffered chunks
      const audioBlob = new Blob(audioBufferRef.current, { type: "audio/wav" });

      // Reset buffer
      audioBufferRef.current = [];

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob);
      formData.append("session_id", session._id);
      formData.append("visit_id", selectedVisit?._id || "");

      // Send to server
      const response = await fetch("http://127.0.0.1:8000/record/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      await response.json();
      console.log("Successfully processed buffered audio");
    } catch (error) {
      console.error("Error processing buffered audio:", error);
    } finally {
      processingBufferRef.current = false;
    }
  };

  // Helper to clean up audio context
  const cleanupAudioContext = () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (selectedVisit?.additional_context?.trim() !== "") {
      setIsAdditionalContextFocused(true);
      return;
    }
    if (isAdditionalContextFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdditionalContextFocused, selectedVisit?.additional_context]);

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, name: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session._id,
      data: {
        _id: selectedVisit?._id,
        name: e.target.value,
      },
    });
  };

  const additionalContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, additional_context: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session._id,
      data: {
        _id: selectedVisit?._id,
        additional_context: e.target.value,
      },
    });
  };

  const selectTemplate = (value: string) => {
    dispatch(setSelectedVisit({ ...selectedVisit, template_id: value }));
    send({
      type: "update_visit",
      session_id: session._id,
      data: {
        _id: selectedVisit?._id,
        template_id: value,
      },
    });
  };

  const selectLanguage = (value: string) => {
    dispatch(setSelectedVisit({ ...selectedVisit, language: value }));
    send({
      type: "update_visit",
      session_id: session._id,
      data: {
        _id: selectedVisit?._id,
        language: value,
      },
    });
  };

  const startRecording = async () => {
    const errors: Record<string, string> = !selectedVisit?.template_id ? { template: "Please select a template" } : {};

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setConnectionStatus("connecting");

      // Send start recording message to server
      send({
        type: "start_recording",
        session_id: session._id,
        data: {
          visit_id: selectedVisit?._id,
        },
      });

      // Start recording timer
      recordingStartTimeRef.current = Date.now();
      setRecording(true);
      isRecordingRef.current = true;

      // Start appropriate recording mode based on internet connection
      if (internetStatusRef.current) {
        setRecordingMode("realtime");
        recordingModeRef.current = "realtime";
        initAudioProcessing();
        setConnectionStatus("connected");
      } else {
        setRecordingMode("buffering");
        recordingModeRef.current = "buffering";
        startBufferingRecording();
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      setConnectionStatus("disconnected");
    }
  };

  const pauseRecording = () => {
    send({
      type: "pause_recording",
      session_id: session._id,
      data: {
        visit_id: selectedVisit?._id,
      },
    });

    // Stop recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const resumeRecording = () => {
    send({
      type: "resume_recording",
      session_id: session._id,
      data: {
        visit_id: selectedVisit?._id,
      },
    });

    // Update start time to account for paused duration
    if (recordingStartTimeRef.current) {
      const pausedTime = Date.now() - recordingStartTimeRef.current;
      recordingStartTimeRef.current = Date.now() - pausedTime;
    }
  };

  const finishRecording = () => {
    send({
      type: "finish_recording",
      session_id: session._id,
      data: {
        visit_id: selectedVisit?._id,
      },
    });

    stopRecording();
  };

  const stopRecording = async () => {
    // Process any remaining buffered audio if in buffering mode
    if (recordingMode === "buffering" && audioBufferRef.current.length > 0 && internetStatusRef.current) {
      await processBufferedAudio();
    }

    // Clean up MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Clean up audio context
    cleanupAudioContext();

    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setConnectionStatus("disconnected");
    setRecording(false);
    isRecordingRef.current = false;
    recordingStartTimeRef.current = null;
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
              <div className="flex items-center gap-2">
                {/* Internet status indicator */}
                <div className="flex items-center" title={internetStatus ? "Internet connected" : "Internet disconnected"}>
                  {internetStatus ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                </div>

                {/* WebSocket connection status indicator */}
                <div className="flex items-center" title={connectionStatus === "connected" ? "WebSocket connected" : connectionStatus === "connecting" ? "WebSocket connecting" : "WebSocket disconnected"}>
                  {connectionStatus === "connected" ? <Cloud className="h-4 w-4 text-green-500" /> : connectionStatus === "connecting" ? <Cloud className="h-4 w-4 text-yellow-500" /> : <CloudOff className="h-4 w-4 text-red-500" />}
                </div>

                <span className="font-normal text-muted-foreground md:inline-block">{recording ? recordingDuration : selectedVisit?.recording_duration || "Not started"}</span>
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
                <Textarea placeholder="ex. 32 year old male with a history of hypertension and diabetes" className="w-full h-28 resize-none" value={selectedVisit?.additional_context} onChange={additionalContextChange} onFocus={() => setIsAdditionalContextFocused(true)} onBlur={() => (selectedVisit?.additional_context?.trim() ? setIsAdditionalContextFocused(true) : setIsAdditionalContextFocused(false))} ref={textareaRef} />
              </div>
            )}

            <Separator />

            <AudioVisualizer />

            {recordingMode === "buffering" && recording && (
              <div className="flex items-center justify-center bg-yellow-100 text-yellow-800 p-2 rounded-md text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline mode: Recording will be transcribed when connection is restored
              </div>
            )}

            {selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
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
                  {recordingDuration}
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
                  {recordingDuration}
                </Button>
                <Button className="flex-1" onClick={finishRecording}>
                  <CheckCircle className="h-4 w-4" />
                  Finish
                </Button>
              </div>
            )}

            {!selectedVisit?.additional_context?.trim() && selectedVisit?.status === "NOT_STARTED" && (
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
