"use client";

import { useRecorder } from "./record";

export default function RecordPage() {
  const { start, stop, recording, mode, internetStatus, connectionStatus, formattedTranscripts } = useRecorder();

  // Handle recording toggle
  const toggleRecording = async () => {
    if (recording) {
      await stop();
    } else {
      await start();
    }
  };

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
            <div className={`w-4 h-4 rounded-full mr-2 ${connectionStatus === "disconnected" ? "bg-red-500" : connectionStatus === "connecting" ? "bg-yellow-500" : "bg-green-500"}`} />
            <span>Server: {connectionStatus}</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button onClick={toggleRecording} className={`px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all ${recording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}>
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {/* Transcript display */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <div className="w-full h-64 overflow-y-auto p-4 border border-gray-300 rounded-lg bg-gray-50">
            <pre className="whitespace-pre-wrap font-sans text-sm">{formattedTranscripts || "No transcripts available yet."}</pre>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Current mode: {mode === "realtime" ? "Real-time transcription" : "Buffering audio"}</p>
          {!internetStatus && recording && <p className="mt-2 text-orange-500">Offline mode: Recording will be transcribed when connection is restored</p>}
        </div>
      </div>
    </main>
  );
}
