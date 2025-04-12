"use client";

import React, { useEffect, useRef, useState } from "react";
import { Label } from "./label";

export function AudioVisualizer() {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(8).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 32;

        const updateVisualization = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = Math.min(average / 128, 1);
          const newLevels = Array(8).fill(0);
          const activeBars = Math.ceil(normalizedLevel * 8);
          for (let i = 0; i < activeBars; i++) {
            newLevels[i] = 1;
          }
          setAudioLevels(newLevels);
          animationFrameRef.current = requestAnimationFrame(updateVisualization);
        };
        updateVisualization();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-between w-full">
      <Label className="text-sm font-normal text-muted-foreground">Microphone test</Label>
      <div className="flex gap-1">
        {audioLevels.map((level, index) => (
          <div key={index} className={`h-4 w-1 rounded transition-colors ${level ? "bg-primary" : "bg-primary/20"}`} />
        ))}
      </div>
    </div>
  );
}
