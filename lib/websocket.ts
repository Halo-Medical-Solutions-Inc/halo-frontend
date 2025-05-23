import React, { useState, useEffect } from "react";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

export interface WebSocketMessage {
  type: "create_template" | "update_template" | "delete_template" | "duplicate_template" | "create_visit" | "update_visit" | "delete_visit" | "update_user" | "error" | "start_recording" | "pause_recording" | "finish_recording" | "resume_recording" | "note_generated" | "generate_note";
  session_id: string;
  data: Record<string, any>;
}

export interface WebSocketResponse {
  type: "create_template" | "update_template" | "delete_template" | "duplicate_template" | "create_visit" | "update_visit" | "delete_visit" | "update_user" | "error" | "start_recording" | "pause_recording" | "finish_recording" | "resume_recording" | "note_generated" | "generate_note";
  data: Record<string, any>;
  was_requested: boolean;
}

type MessageHandler = (data: WebSocketResponse) => void;
type StatusListener = (status: { online: boolean; connected: boolean }) => void;

let websocket: WebSocket | null = null;
let isConnecting = false;
const messageHandlers: Record<string, Record<string, MessageHandler>> = {};
const statusListeners: Record<string, StatusListener> = {};

export let online = typeof navigator !== "undefined" ? navigator.onLine : false;
export let connected = false;

export const isOnline = () => online;
export const isConnected = () => connected;

const notifyStatusChange = () => {
  Object.values(statusListeners).forEach((listener) => {
    listener({ online, connected });
  });
};

export const useConnectionStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState(online);
  const [connectedStatus, setConnectedStatus] = useState(connected);

  useEffect(() => {
    const listenerId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    statusListeners[listenerId] = ({ online: updatedOnlineStatus, connected: updatedConnectionStatus }) => {
      setOnlineStatus(updatedOnlineStatus);
      setConnectedStatus(updatedConnectionStatus);
    };

    setOnlineStatus(online);
    setConnectedStatus(connected);

    const handleOnline = () => {
      online = true;
      notifyStatusChange();
    };

    const handleOffline = () => {
      online = false;
      notifyStatusChange();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      delete statusListeners[listenerId];
    };
  }, []);

  return { online: onlineStatus, connected: connectedStatus };
};

export const connect = (sessionId: string) => {
  if (websocket?.readyState === WebSocket.OPEN || isConnecting) return;

  if (!sessionId) {
    return;
  }

  isConnecting = true;
  websocket = new WebSocket(`${WEBSOCKET_URL}/${sessionId}`);

  websocket.onopen = () => {
    isConnecting = false;
    connected = true;
    console.log("connected", connected);
    notifyStatusChange();
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
    connected = false;
    console.log("disconnected", connected);
    notifyStatusChange();
    setTimeout(() => connect(sessionId), 1000);
  };

  websocket.onerror = (error: Event) => {
    isConnecting = false;
    connected = false;
    notifyStatusChange();
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

  messageHandlers[type][id] = handler;

  return () => {
    if (messageHandlers[type] && messageHandlers[type][id]) {
      delete messageHandlers[type][id];

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

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    online = true;
    notifyStatusChange();
  });

  window.addEventListener("offline", () => {
    online = false;
    notifyStatusChange();
  });
}
