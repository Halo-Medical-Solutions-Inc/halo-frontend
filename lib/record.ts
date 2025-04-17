"use client";

import { useState, useRef, useEffect } from "react";

// Define a custom type to include timestamp with blob array
interface AudioBuffer extends Array<Blob> {
  timestamp?: string;
}

export function useRecorder(sessionId?: string, visitId?: string) {
  // State variables
  const [recording, setRecording] = useState(false);
  const [internetStatus, setInternetStatus] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected

  // Refs for managing audio and WebSocket connections
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<AudioBuffer>([]);
  const modeRef = useRef<"realtime" | "buffering">("realtime");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processingBufferRef = useRef<boolean>(false);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const visitIdRef = useRef<string | undefined>(visitId);

  // Update refs when props change
  useEffect(() => {
    sessionIdRef.current = sessionId;
    visitIdRef.current = visitId;
  }, [sessionId, visitId]);

  // Monitor internet connection status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setInternetStatus(true);
      if (recording && modeRef.current === "buffering") {
        // When internet connection is restored, process any buffered audio
        processBufferedAudio().then(() => {
          // After processing buffer, reconnect WebSocket for real-time transcription
          startRealtimeRecording();
        });
      }
    };

    const handleOffline = () => {
      setInternetStatus(false);
      if (recording && modeRef.current === "realtime") {
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
  }, [recording]);

  // Initialize WebSocket and start real-time transcription
  const startRealtimeRecording = async () => {
    try {
      if (!sessionIdRef.current || !visitIdRef.current) {
        console.error("Session ID or Visit ID is missing");
        return;
      }

      modeRef.current = "realtime";
      setConnectionStatus("connecting");

      // Close any existing WebSocket
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Initialize WebSocket with session_id and visit_id
      const wsUrl = `ws://127.0.0.1:8000/record/ws/transcribe?session_id=${sessionIdRef.current}&visit_id=${visitIdRef.current}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established");
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.status === "ready_for_audio") {
          setConnectionStatus("connected");
          initAudioProcessing();
          // Only set recording to true after WebSocket is connected and audio processing is ready
          setRecording(true);
        } else if (data.error) {
          console.error("WebSocket error:", data.error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");

        // If internet is still connected but WebSocket failed, try again
        if (internetStatus && recording) {
          setTimeout(() => {
            startRealtimeRecording();
          }, 3000);
        }
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setConnectionStatus("disconnected");

        // If we're still recording and internet is connected, reconnect
        if (recording && internetStatus && modeRef.current === "realtime") {
          setTimeout(() => {
            startRealtimeRecording();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Failed to start real-time recording:", error);
      setConnectionStatus("disconnected");

      // If internet is connected but failed to connect, try buffering
      if (internetStatus && recording) {
        startBufferingRecording();
      }
    }
  };

  // Initialize audio processing for real-time transcription
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
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && modeRef.current === "realtime") {
          // Get audio data
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert float32 to int16 (linear16 encoding)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          // Send the audio data as binary
          socketRef.current.send(pcmData.buffer);
        }
      };

      // Connect the nodes
      source.connect(processorNodeRef.current);
      console.log("Audio processing initialized for real-time transcription");
    } catch (error) {
      console.error("Error initializing audio processing:", error);

      // If failed to initialize audio processing, switch to buffering mode
      if (recording) {
        switchToBufferingMode();
      }
    }
  };

  // Start buffering recording when offline
  const startBufferingRecording = () => {
    try {
      modeRef.current = "buffering";
      setConnectionStatus("disconnected");

      // Reset audio buffer
      audioBufferRef.current = [];

      // Store the timestamp when buffering started
      const bufferStartTime = new Date().toISOString();
      audioBufferRef.current.timestamp = bufferStartTime;

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
      console.log("Started buffering audio with timestamp:", bufferStartTime);
      setRecording(true);
    } catch (error) {
      console.error("Error starting buffering recording:", error);
    }
  };

  // Switch from real-time to buffering mode
  const switchToBufferingMode = () => {
    console.log("Switching to buffering mode");

    // Clean up real-time recording
    cleanupAudioContext();

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Start buffering
    startBufferingRecording();
  };

  // Process buffered audio when internet connection is restored
  const processBufferedAudio = async () => {
    if (processingBufferRef.current || audioBufferRef.current.length === 0) {
      return;
    }

    try {
      if (!sessionIdRef.current || !visitIdRef.current) {
        console.error("Session ID or Visit ID is missing");
        return;
      }

      processingBufferRef.current = true;
      console.log("Processing buffered audio");

      // Stop current MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      // Create a blob from all buffered chunks
      const audioBlob = new Blob(audioBufferRef.current, { type: "audio/wav" });

      // Get the buffer start timestamp
      const bufferTimestamp = audioBufferRef.current.timestamp;

      // Reset buffer
      audioBufferRef.current = [];

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob);
      formData.append("session_id", sessionIdRef.current);
      formData.append("visit_id", visitIdRef.current);

      // Add timestamp if available
      if (bufferTimestamp) {
        formData.append("timestamp", bufferTimestamp);
        console.log("Sending buffered audio with timestamp:", bufferTimestamp);
      }

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

  // Start recording
  const start = async () => {
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start real-time or buffering based on internet connection
      if (internetStatus) {
        await startRealtimeRecording();
      } else {
        startBufferingRecording();
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  // Stop all recording and clean up
  const stop = async () => {
    // Process any remaining buffered audio if in buffering mode
    if (modeRef.current === "buffering" && audioBufferRef.current.length > 0 && internetStatus) {
      await processBufferedAudio();
    }

    // Clean up WebSocket
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ text: "stop_recording" }));
      }
      socketRef.current.close();
      socketRef.current = null;
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

    setConnectionStatus("disconnected");
    setRecording(false);
    console.log("Recording stopped and cleaned up");
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stop();
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  return {
    start,
    stop,
    recording,
    mode: modeRef.current,
    internetStatus,
    connectionStatus,
  };
}
