const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/user/ws";

interface WebSocketMessage {
  type: "create_template" | "update_template" | "delete_template" | "create_visit" | "update_visit" | "delete_visit";
  session_id: string;
  data: Record<string, any>;
}

interface WebSocketResponse {
  type: "create_template" | "update_template" | "delete_template" | "create_visit" | "update_visit" | "delete_visit";
  data: Record<string, any>;
  was_requested: boolean;
}

type MessageHandler = (data: WebSocketResponse) => void;

let websocket: WebSocket | null = null;
let isConnecting = false;
const messageHandlers: Record<string, MessageHandler> = {};

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
      messageHandlers[data.type](data);
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

export const handle = (type: WebSocketResponse["type"], handler: MessageHandler) => {
  messageHandlers[type] = handler;
  return () => {
    if (messageHandlers[type] === handler) {
      delete messageHandlers[type];
    }
  };
};

export const useWebSocket = () => {
  return { send, handle, connect };
};

export default useWebSocket;
