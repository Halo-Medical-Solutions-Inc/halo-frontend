import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriberConfig {
  visitId: string;
  onStatusUpdate?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onTranscript?: (transcript: { text: string; isFinal: boolean }) => void;
  onError?: (error: Error) => void;
}

class AudioTranscriber {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private config: TranscriberConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

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
          console.log("Audio WebSocket connected to this endpoint", `${wsUrl}/${this.config.visitId}`);
          this.config.onStatusUpdate?.("connected");
          this.reconnectAttempts = 0;
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

          if (this.isRecording && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.connect()
                .then(() => {
                  if (this.isRecording) {
                    this.startAudioProcessing();
                  }
                })
                .catch(console.error);
            }, 1000 * this.reconnectAttempts);
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

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          this.ws.send(pcmData.buffer);
        }
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      console.log("Audio processing started");
    } catch (error) {
      console.error("Error starting audio processing:", error);
      throw error;
    }
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
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function useTranscriber(visitId?: string) {
  const transcriberRef = useRef<AudioTranscriber | null>(null);
  const [connected, setConnected] = useState(false);
  const [microphone, setMicrophone] = useState(false);

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
          setConnected(false);
        },
      });

      await transcriberRef.current.connect();
      await transcriberRef.current.startRecording();
    } catch (error) {
      console.error("Error starting transcriber:", error);
      setConnected(false);
      throw error;
    }
  }, [visitId, microphone]);

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
  };
}
