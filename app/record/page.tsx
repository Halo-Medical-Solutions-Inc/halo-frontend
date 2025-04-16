"use client";

import { useState, useRef, useEffect } from "react";

// Define a custom type to include timestamp with blob array
interface AudioBuffer extends Array<Blob> {
  timestamp?: string;
}

export default function RecordPage() {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [internetStatus, setInternetStatus] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  // Refs for managing audio and WebSocket connections
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<AudioBuffer>([]);
  const recordingModeRef = useRef<"realtime" | "buffering">("realtime");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processingBufferRef = useRef<boolean>(false);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch transcripts periodically
  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/record/get_transcript');
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        setTranscripts(data);
      } catch (error) {
        console.error("Error fetching transcripts:", error);
      }
    };

    // Initial fetch
    fetchTranscripts();

    // Set up interval (every 500ms)
    fetchIntervalRef.current = setInterval(fetchTranscripts, 500);

    // Clean up interval on unmount
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  // Monitor internet connection status
  useEffect(() => {
    const handleOnline = () => {
      setInternetStatus(true);
      if (isRecording && recordingModeRef.current === "buffering") {
        // When internet connection is restored, process any buffered audio
        processBufferedAudio().then(() => {
          // After processing buffer, reconnect WebSocket for real-time transcription
          startRealtimeRecording();
        });
      }
    };
    
    const handleOffline = () => {
      setInternetStatus(false);
      if (isRecording && recordingModeRef.current === "realtime") {
        // Switch to buffering mode when internet connection is lost
        switchToBufferingMode();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isRecording]);

  // Handle recording toggle
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Start recording
  const startRecording = async () => {
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
      
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  // Initialize WebSocket and start real-time transcription
  const startRealtimeRecording = async () => {
    try {
      recordingModeRef.current = "realtime";
      setConnectionStatus("connecting");

      // Close any existing WebSocket
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Initialize WebSocket
      const wsUrl = `ws://127.0.0.1:8000/record/ws/transcribe`;
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
        } else if (data.error) {
          console.error("WebSocket error:", data.error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
        
        // If internet is still connected but WebSocket failed, try again
        if (internetStatus && isRecording) {
          setTimeout(() => {
            startRealtimeRecording();
          }, 3000);
        }
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setConnectionStatus("disconnected");
        
        // If we're still recording and internet is connected, reconnect
        if (isRecording && internetStatus && recordingModeRef.current === "realtime") {
          setTimeout(() => {
            startRealtimeRecording();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Failed to start real-time recording:", error);
      setConnectionStatus("disconnected");
      
      // If internet is connected but failed to connect, try buffering
      if (internetStatus && isRecording) {
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
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && recordingModeRef.current === "realtime") {
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
      if (isRecording) {
        switchToBufferingMode();
      }
    }
  };

  // Start buffering recording when offline
  const startBufferingRecording = () => {
    try {
      recordingModeRef.current = "buffering";
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
      processingBufferRef.current = true;
      console.log("Processing buffered audio");
      
      // Stop current MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      
      // Create a blob from all buffered chunks
      const audioBlob = new Blob(audioBufferRef.current, { type: 'audio/wav' });
      
      // Get the buffer start timestamp
      const bufferTimestamp = audioBufferRef.current.timestamp;
      
      // Reset buffer
      audioBufferRef.current = [];
      
      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob);
      
      // Add timestamp if available
      if (bufferTimestamp) {
        formData.append('timestamp', bufferTimestamp);
        console.log("Sending buffered audio with timestamp:", bufferTimestamp);
      }
      
      // Send to server
      const response = await fetch('http://127.0.0.1:8000/record/transcribe', {
        method: 'POST',
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

  // Stop all recording and clean up
  const stopRecording = async () => {
    setIsRecording(false);
    
    // Process any remaining buffered audio if in buffering mode
    if (recordingModeRef.current === "buffering" && audioBufferRef.current.length > 0 && internetStatus) {
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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setConnectionStatus("disconnected");
    console.log("Recording stopped and cleaned up");
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

  // Format transcripts for display
  const formatTranscripts = () => {
    return Object.entries(transcripts)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, text]) => {
        const formattedDate = new Date(date).toLocaleTimeString();
        return `[${formattedDate}] ${text}`;
      })
      .join('\n\n');
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-xl p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-8 text-center">Halo Transcription</h1>
        
        <div className="flex justify-center space-x-6 mb-8">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${internetStatus ? "bg-green-500" : "bg-red-500"}`} />
            <span>Internet: {internetStatus ? "Online" : "Offline"}</span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${
              connectionStatus === "disconnected" ? "bg-red-500" : 
              connectionStatus === "connecting" ? "bg-yellow-500" : "bg-green-500"
            }`} />
            <span>Server: {connectionStatus}</span>
          </div>
        </div>
        
        <div className="flex justify-center mb-8">
          <button 
            onClick={toggleRecording}
            className={`px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all ${
              isRecording 
                ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>
        
        {/* Transcript display */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <div className="w-full h-64 overflow-y-auto p-4 border border-gray-300 rounded-lg bg-gray-50">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {formatTranscripts() || "No transcripts available yet."}
            </pre>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Current mode: {recordingModeRef.current === "realtime" ? "Real-time transcription" : "Buffering audio"}</p>
          {!internetStatus && isRecording && (
            <p className="mt-2 text-orange-500">
              Offline mode: Recording will be transcribed when connection is restored
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
