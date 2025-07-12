import { useCallback, useEffect, useRef, useState } from "react";
import { apiProcessFile } from "@/store/api"; // Import the API function

interface TranscriberConfig {
  visitId: string;
  onStatusUpdate?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onTranscript?: (transcript: { text: string; isFinal: boolean }) => void;
  onError?: (error: Error) => void;
  onAudioLevelUpdate?: (level: number) => void;
  onRequestMicPermissions?: () => Promise<void>;
}

class AudioTranscriber {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private config: TranscriberConfig;
  private audioLevelCheckInterval: NodeJS.Timeout | null = null;
  private lastAudioLevel = 0;
  
  // Add offline buffering properties
  private isOffline = false;
  private offlineAudioBuffer: Int16Array[] = [];
  private offlineStartTime: number | null = null;
  private offlineBufferSampleRate = 16000;

  constructor(config: TranscriberConfig) {
    this.config = config;
    
    // Initialize offline state
    this.isOffline = !navigator.onLine;
    
    // Bind event handlers
    this.handleOffline = this.handleOffline.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    if (this.isOffline) {
      console.log("Starting in offline mode");
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_URL;
        const wsUrl = backendUrl?.replace("http", "ws");
        this.ws = new WebSocket(`${wsUrl}/${this.config.visitId}`);

        this.ws.onopen = () => {
          console.log("Audio WebSocket connected");
          this.config.onStatusUpdate?.("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.status === "ready") {
              console.log("Audio WebSocket ready to receive audio");
            } else if (data.transcript) {
              this.config.onTranscript?.(data.transcript);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("Audio WebSocket error:", error);
          this.config.onStatusUpdate?.("error");
          this.config.onError?.(new Error("WebSocket connection error"));
          reject(new Error("WebSocket connection error"));
        };

        this.ws.onclose = () => {
          console.log("Audio WebSocket disconnected");
          this.config.onStatusUpdate?.("disconnected");
          // Do not call cleanup here to keep audio processing running for buffering
          if (this.isRecording && !this.offlineStartTime) {
            console.log("Started offline audio buffering due to disconnection");
            this.offlineStartTime = Date.now();
          }
        };

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  async reconnect(): Promise<void> {
    try {
      console.log("Attempting to reconnect WebSocket");
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        this.ws.close();
      }
      this.ws = null;
      
      await this.connect();
      
      // Process any existing buffer after successful reconnection
      if (this.offlineAudioBuffer.length > 0) {
        await this.processOfflineBuffer();
      }
    } catch (error) {
      console.error("WebSocket reconnect failed:", error);
      this.config.onError?.(error as Error);
    }
  }

  async startRecording(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.isRecording = true;

    await this.startAudioProcessing();
  }

  private async startAudioProcessing(): Promise<void> {
    try {
      if (!this.stream) {
        throw new Error("No audio stream available");
      }

      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });

      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (this.isRecording) {
          const inputData = e.inputBuffer.getChannelData(0);

          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avgLevel = sum / inputData.length;
          this.lastAudioLevel = avgLevel;

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          // Send to WebSocket if connected
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(pcmData.buffer);
          } else {
            // Buffer if not connected
            if (!this.offlineStartTime) {
              console.log("Started offline audio buffering (no open WebSocket)");
              this.offlineStartTime = Date.now();
            }
            this.offlineAudioBuffer.push(new Int16Array(pcmData));
            
            // Periodic logging
            if (this.offlineAudioBuffer.length % 100 === 0) {
              const duration = (this.offlineAudioBuffer.length * 4096) / this.offlineBufferSampleRate;
              console.log(`Buffering audio: ${duration.toFixed(1)} seconds`);
            }
            
            // Limit buffer size to prevent memory issues (e.g., 5 minutes max)
            const maxBufferDuration = 5 * 60; // 5 minutes in seconds
            const samplesPerSecond = this.offlineBufferSampleRate;
            const maxSamples = maxBufferDuration * samplesPerSecond;
            const currentSamples = this.offlineAudioBuffer.reduce((acc, buf) => acc + buf.length, 0);
            
            if (currentSamples > maxSamples) {
              console.warn("Offline buffer limit reached, removing oldest audio");
              // Remove oldest audio to stay within limit
              while (this.offlineAudioBuffer.length > 0) {
                const totalSamples = this.offlineAudioBuffer.reduce((acc, buf) => acc + buf.length, 0);
                if (totalSamples <= maxSamples) break;
                this.offlineAudioBuffer.shift();
              }
            }
          }
        }
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.startAudioLevelMonitoring();

      console.log("Audio processing started");
    } catch (error) {
      console.error("Error starting audio processing:", error);
      throw error;
    }
  }

  private startAudioLevelMonitoring(): void {
    this.audioLevelCheckInterval = setInterval(async () => {
      if (this.isRecording) {
        this.config.onAudioLevelUpdate?.(this.lastAudioLevel);

        // console.log("Audio level:", this.lastAudioLevel);

        if (this.lastAudioLevel === 0) {
          this.config.onError?.(new Error("AUDIO_NOT_DETECTED"));

          try {
            await this.config.onRequestMicPermissions?.();
          } catch (error) {
            console.error("Failed to request mic permissions:", error);
          }
        }
      }
    }, 500);
  }

  pauseRecording(): void {
    this.isRecording = false;
    this.stopAudioProcessing();
  }

  async disconnect(): Promise<void> {
    this.isRecording = false;
    
    // Process any remaining offline buffer before disconnecting
    if (this.offlineAudioBuffer.length > 0 && !this.isOffline) {
      await this.processOfflineBuffer();
    }
    
    this.cleanup();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  private stopAudioProcessing(): void {
    if (this.audioLevelCheckInterval) {
      clearInterval(this.audioLevelCheckInterval);
      this.audioLevelCheckInterval = null;
    }

    // Only stop audio processing if we're not buffering offline audio
    if (!this.isOffline || !this.isRecording) {
      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode = null;
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
    }
  }

  private handleOffline() {
    console.log("Internet connection lost (offline event), starting offline buffering");
    this.isOffline = true;
    if (this.isRecording && !this.offlineStartTime) {
      this.offlineStartTime = Date.now();
      this.offlineAudioBuffer = [];
      console.log("Offline buffering initialized via offline event");
    }
  }

  private async handleOnline() {
    console.log("Internet connection restored (online event)");
    this.isOffline = false;
    
    // Process buffered audio if any
    if (this.offlineAudioBuffer.length > 0 && this.isRecording) {
      await this.processOfflineBuffer();
    }
  }

  private async processOfflineBuffer(): Promise<void> {
    try {
      console.log(`Processing offline audio buffer with ${this.offlineAudioBuffer.length} chunks`);
      
      // Convert buffer to WAV file
      const wavBlob = this.createWavFile(this.offlineAudioBuffer);
      
      // Create a File object
      const fileName = `offline_recording_${Date.now()}.wav`;
      const file = new File([wavBlob], fileName, { type: 'audio/wav' });
      
      console.log(`Sending offline audio file (${(file.size / 1024 / 1024).toFixed(2)} MB) for transcription`);
      
      // Add retry logic
      let attempts = 0;
      const maxRetries = 5;
      while (attempts < maxRetries) {
        try {
          await apiProcessFile(this.config.visitId, file);
          console.log(`Offline audio uploaded successfully on attempt ${attempts + 1}`);
          break;
        } catch (error) {
          attempts++;
          console.error(`Failed to upload offline audio on attempt ${attempts}:`, error);
          if (attempts >= maxRetries) {
            throw new Error(`Failed to process offline audio after ${maxRetries} attempts`);
          }
          // Exponential backoff: wait 1s * attempt number
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      // Clear the buffer after successful upload
      this.offlineAudioBuffer = [];
      this.offlineStartTime = null;
      
      console.log("Offline audio processed successfully");
    } catch (error) {
      console.error("Error processing offline buffer:", error);
      this.config.onError?.(new Error("Failed to process offline audio"));
    }
  }

  private createWavFile(audioBuffers: Int16Array[]): Blob {
    // Calculate total length
    const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
    
    // Create a single buffer with all audio data
    const fullBuffer = new Int16Array(totalLength);
    let offset = 0;
    for (const buffer of audioBuffers) {
      fullBuffer.set(buffer, offset);
      offset += buffer.length;
    }
    
    // Create WAV header
    const sampleRate = this.offlineBufferSampleRate;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = fullBuffer.length * 2; // 2 bytes per sample
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    let dataOffset = 44;
    for (let i = 0; i < fullBuffer.length; i++) {
      view.setInt16(dataOffset, fullBuffer[i], true);
      dataOffset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private cleanup(): void {
    this.stopAudioProcessing();
    this.ws = null;
    
    // Clean up event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    // Clear offline buffer
    this.offlineAudioBuffer = [];
    this.offlineStartTime = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function useTranscriber(visitId?: string) {
  const transcriberRef = useRef<AudioTranscriber | null>(null);
  const [connected, setConnected] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioNotDetected, setAudioNotDetected] = useState(false);
  // Add state to track if we should be transcribing (for reconnection logic)
  const [shouldTranscribe, setShouldTranscribe] = useState(false);

  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophone(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Microphone not available:", error);
        setMicrophone(false);
      }
    };

    checkMicrophone();
  }, []);

  const requestMicPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophone(true);
      setAudioNotDetected(false);
      stream.getTracks().forEach((track) => track.stop());
      console.log("Microphone permissions granted");
    } catch (error) {
      console.error("Failed to get microphone permissions:", error);
      setMicrophone(false);
      throw error;
    }
  }, []);

  const startTranscriber = useCallback(async () => {
    if (!visitId) {
      throw new Error("Visit ID is required");
    }

    if (!microphone) {
      throw new Error("Microphone not available");
    }

    // Set shouldTranscribe to true before attempting to start
    setShouldTranscribe(true);

    try {
      if (transcriberRef.current) {
        await transcriberRef.current.disconnect();
      }

      transcriberRef.current = new AudioTranscriber({
        visitId,
        onStatusUpdate: (status) => {
          console.log("Transcriber status:", status);
          setConnected(status === "connected");
        },
        onTranscript: (transcript) => {
          console.log("Received transcript:", transcript);
        },
        onError: (error) => {
          console.error("Transcriber error:", error);
          if (error.message === "AUDIO_NOT_DETECTED") {
            setAudioNotDetected(true);
          } else {
            setConnected(false);
          }
        },
        onAudioLevelUpdate: (level) => {
          setAudioLevel(level);
          if (level > 0) {
            setAudioNotDetected(false);
          }
        },
        onRequestMicPermissions: requestMicPermissions,
      });

      await transcriberRef.current.connect();
      await transcriberRef.current.startRecording();
    } catch (error) {
      console.error("Error starting transcriber:", error);
      setConnected(false);
      throw error;
    }
  }, [visitId, microphone, requestMicPermissions]);

  const stopTranscriber = useCallback(async () => {
    if (transcriberRef.current) {
      await transcriberRef.current.disconnect();
      transcriberRef.current = null;
    }
    setConnected(false);
    // Set shouldTranscribe to false after stopping
    setShouldTranscribe(false);
  }, []);

  useEffect(() => {
    return () => {
      if (transcriberRef.current) {
        transcriberRef.current.disconnect();
      }
    };
  }, []);

  // Add effect to handle reconnection when internet comes back online
  useEffect(() => {
    const handleOnline = async () => {
      if (shouldTranscribe && !connected) {
        console.log("Internet reconnected, attempting to restart transcriber");
        try {
          if (transcriberRef.current) {
            await transcriberRef.current.reconnect();
            setConnected(true); // Update connected state after successful reconnect
          } else {
            await startTranscriber();
          }
        } catch (error) {
          console.error("Failed to reconnect transcriber:", error);
          setConnected(false);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [shouldTranscribe, connected, startTranscriber]);

  return {
    startTranscriber,
    stopTranscriber,
    connected,
    microphone,
    audioLevel,
    audioNotDetected,
    requestMicPermissions,
  };
}
