const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/user/ws";

export interface WebSocketMessage {
  type: "create_template" | "update_template" | "delete_template" | "duplicate_template" | "create_visit" | "update_visit" | "delete_visit" | "update_user" | "error" | "start_recording" | "pause_recording" | "finish_recording" | "resume_recording" | "audio_chunk" | "note_generated" | "regenerate_note";
  session_id: string;
  data: Record<string, any>;
}

export interface WebSocketResponse {
  type: "create_template" | "update_template" | "delete_template" | "duplicate_template" | "create_visit" | "update_visit" | "delete_visit" | "update_user" | "error" | "start_recording" | "pause_recording" | "finish_recording" | "resume_recording" | "audio_chunk" | "note_generated" | "regenerate_note";
  data: Record<string, any>;
  was_requested: boolean;
}

type MessageHandler = (data: WebSocketResponse) => void;

let websocket: WebSocket | null = null;
let isConnecting = false;
const messageHandlers: Record<string, Record<string, MessageHandler>> = {};

export const connect = (sessionId: string) => {
  if (websocket?.readyState === WebSocket.OPEN || isConnecting) return;

  if (!sessionId) {
    return;
  }

  isConnecting = true;
  websocket = new WebSocket(`${WEBSOCKET_URL}/${sessionId}`);

  websocket.onopen = () => {
    isConnecting = false;
  };

  websocket.onmessage = (event: MessageEvent) => {
    const data: WebSocketResponse = JSON.parse(event.data);
    if (messageHandlers[data.type]) {
      Object.values(messageHandlers[data.type]).forEach((handler) => {
        handler(data);
      });
    }
  };

  websocket.onclose = () => {
    isConnecting = false;
    setTimeout(() => connect(sessionId), 1000);
  };

  websocket.onerror = (error: Event) => {
    isConnecting = false;
    if (websocket) {
      websocket.close();
    }
  };
};

export const send = (message: WebSocketMessage) => {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  }
};

export const handle = (type: WebSocketResponse["type"], id: string, handler: MessageHandler) => {
  if (!messageHandlers[type]) {
    messageHandlers[type] = {};
  }

  // If a handler with the same ID exists, it will be replaced
  messageHandlers[type][id] = handler;

  return () => {
    if (messageHandlers[type] && messageHandlers[type][id]) {
      delete messageHandlers[type][id];

      // Clean up the type object if no handlers remain
      if (Object.keys(messageHandlers[type]).length === 0) {
        delete messageHandlers[type];
      }
    }
  };
};

export const useWebSocket = () => {
  return { send, handle, connect };
};

export default useWebSocket;
