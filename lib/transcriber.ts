import { useCallback, useEffect, useRef, useState } from "react";

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
  private readonly SILENCE_THRESHOLD = 0;
  private permissionRequestInProgress = false;
  private lastPermissionRequestTime = 0;
  private readonly PERMISSION_REQUEST_COOLDOWN = 10000; // 10 seconds
  private audioRestartInProgress = false;
  private consecutiveLowAudioCount = 0;
  private readonly MAX_LOW_AUDIO_COUNT = 6; // 3 seconds at 500ms intervals

  constructor(config: TranscriberConfig) {
    this.config = config;
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
          this.cleanup();
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
        if (this.isRecording && this.ws?.readyState === WebSocket.OPEN) {
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

          this.ws.send(pcmData.buffer);
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

  private async restartAudioProcessing(): Promise<void> {
    if (this.audioRestartInProgress) {
      return;
    }

    console.log("Restarting audio processing due to sustained low audio levels");
    this.audioRestartInProgress = true;

    try {
      // Stop current audio processing
      this.stopAudioProcessing();

      // Check if audio context is suspended and resume it
      if (this.audioContext?.state === 'suspended') {
        console.log("Audio context suspended, resuming...");
        await this.audioContext.resume();
      }

      // Check if stream tracks are still active
      if (this.stream) {
        const tracks = this.stream.getAudioTracks();
        const activeTracks = tracks.filter(track => track.readyState === 'live');
        
        if (activeTracks.length === 0) {
          console.log("No active audio tracks, requesting new stream");
          // Get new stream
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }

      // Restart audio processing with current or new stream
      await this.startAudioProcessing();
      console.log("Audio processing restarted successfully");
    } catch (error) {
      console.error("Failed to restart audio processing:", error);
      this.config.onError?.(new Error("AUDIO_RESTART_FAILED"));
    } finally {
      this.audioRestartInProgress = false;
    }
  }

  private startAudioLevelMonitoring(): void {
    this.audioLevelCheckInterval = setInterval(async () => {
      if (this.isRecording) {
        this.config.onAudioLevelUpdate?.(this.lastAudioLevel);

        console.log("Audio level:", this.lastAudioLevel); 

        if (this.lastAudioLevel <= this.SILENCE_THRESHOLD) {
          this.consecutiveLowAudioCount++;
          
          // If we've had sustained low audio, try restarting audio processing first
          if (this.consecutiveLowAudioCount >= this.MAX_LOW_AUDIO_COUNT && !this.audioRestartInProgress) {
            console.log(`Sustained low audio for ${this.consecutiveLowAudioCount} checks, attempting audio restart`);
            await this.restartAudioProcessing();
            this.consecutiveLowAudioCount = 0; // Reset counter after restart attempt
            return; // Skip permission request logic this cycle
          }

          const now = Date.now();
          
          // Only try to request permissions if enough time has passed and no request is in progress
          if (!this.permissionRequestInProgress && 
              now - this.lastPermissionRequestTime > this.PERMISSION_REQUEST_COOLDOWN) {
            
            console.log("Audio not detected, requesting mic permissions again");
            this.permissionRequestInProgress = true;
            this.lastPermissionRequestTime = now;
            
            try {
              await this.config.onRequestMicPermissions?.();
            } catch (error) {
              console.error("Failed to re-request mic permissions:", error);
              
              // If it's a permission denied error, don't spam the user with more requests
              if (error instanceof Error && error.name === 'NotAllowedError') {
                console.log("Permission denied by user - stopping automatic permission requests");
                this.config.onError?.(new Error("MIC_PERMISSION_DENIED"));
              } else {
                this.config.onError?.(new Error("AUDIO_NOT_DETECTED"));
              }
            } finally {
              this.permissionRequestInProgress = false;
            }
          } else if (this.lastAudioLevel <= this.SILENCE_THRESHOLD) {
            // Still no audio but we're in cooldown period - just notify without requesting permissions
            this.config.onError?.(new Error("AUDIO_NOT_DETECTED"));
          }
        } else {
          // Audio level is good, reset the consecutive low audio count
          this.consecutiveLowAudioCount = 0;
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

  private cleanup(): void {
    this.stopAudioProcessing();
    this.ws = null;
    this.consecutiveLowAudioCount = 0;
    this.audioRestartInProgress = false;
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
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

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
      setMicPermissionDenied(false);
      stream.getTracks().forEach((track) => track.stop());
      console.log("Microphone permissions re-granted");
    } catch (error) {
      console.error("Failed to get microphone permissions:", error);
      setMicrophone(false);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setMicPermissionDenied(true);
      }
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
          } else if (error.message === "MIC_PERMISSION_DENIED") {
            setMicPermissionDenied(true);
            setAudioNotDetected(true);
          } else if (error.message === "AUDIO_RESTART_FAILED") {
            console.error("Failed to restart audio processing - this may require manual intervention");
            setAudioNotDetected(true);
          } else {
            setConnected(false);
          }
        },
        onAudioLevelUpdate: (level) => {
          setAudioLevel(level);
          setAudioNotDetected(level <= 0);
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
  }, []);

  useEffect(() => {
    return () => {
      if (transcriberRef.current) {
        transcriberRef.current.disconnect();
      }
    };
  }, []);

  return {
    startTranscriber,
    stopTranscriber,
    connected,
    microphone,
    audioLevel,
    audioNotDetected,
    micPermissionDenied,
    requestMicPermissions,
  };
}
