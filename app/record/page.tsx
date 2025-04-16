'use client';

import { useState, useRef, useEffect } from 'react';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle recording toggle
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // Initialize WebSocket and audio recording
  const startRecording = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Initialize WebSocket
      const wsUrl = `ws://127.0.0.1:8000/record/ws/transcribe`;
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.status === 'ready_for_audio') {
          setConnectionStatus('connected');
          initAudioRecording();
        } else if (data.transcript) {
          if (data.is_final) {
            setTranscript(prev => prev + ' ' + data.transcript.trim());
          } else {
            // For non-final results, we could show them in a different way
            // For simplicity, we'll just add them to the transcript
            setTranscript(prev => prev + ' ' + data.transcript.trim());
          }
        } else if (data.error) {
          console.error('WebSocket error:', data.error);
        }
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
      
      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('disconnected');
        stopMediaTracks();
      };
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Initialize audio recording with proper format
  const initAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create audio context with 16kHz sample rate (to match backend expectations)
      audioContextRef.current = new AudioContext({
        sampleRate: 16000,
      });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create a script processor to handle raw audio data
      processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current.connect(audioContextRef.current.destination);
      
      processorNodeRef.current.onaudioprocess = (e) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          // Get audio data
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert float32 to int16 (linear16 encoding)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Convert to 16-bit signed integer
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          // Send the audio data as binary
          socketRef.current.send(pcmData.buffer);
        }
      };
      
      // Connect the nodes
      source.connect(processorNodeRef.current);
      
      setIsRecording(true);
      console.log('Audio recording started');
      
    } catch (error) {
      console.error('Error initializing audio recording:', error);
      setConnectionStatus('disconnected');
      if (socketRef.current) {
        socketRef.current.close();
      }
    }
  };

  // Stop recording and clean up
  const stopRecording = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ text: 'stop_recording' }));
    }
    
    stopMediaTracks();
    
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsRecording(false);
    setConnectionStatus('disconnected');
  };

  // Clean up media tracks
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Audio Transcription</h1>
        
        <div className="flex items-center mb-4">
          <div 
            className={`w-4 h-4 rounded-full mr-3 ${
              connectionStatus === 'disconnected' ? 'bg-red-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-green-500'
            }`} 
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>
        
        <button
          onClick={toggleRecording}
          className={`w-full mb-6 py-3 px-4 font-medium rounded-md ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <div className="mb-4">
          <p className="mb-2 font-medium">Transcript:</p>
          <textarea
            value={transcript}
            readOnly
            className="w-full h-64 p-4 border border-gray-300 rounded-md"
            placeholder="Transcript will appear here..."
          />
        </div>
      </div>
    </main>
  );
}
