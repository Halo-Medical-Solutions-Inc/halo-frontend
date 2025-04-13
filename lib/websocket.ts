import { WebSocketMessage, WebSocketResponse } from "@/store/types";

type MessageHandler = (response: WebSocketResponse) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // 1 second
  private sessionId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const worker = new Worker(new URL("./websocket.worker.ts", import.meta.url));
      worker.onmessage = (event) => {
        if (this.messageHandler) {
          this.messageHandler(event.data);
        }
      };
    }
  }

  public connect(sessionId: string) {
    this.sessionId = sessionId;
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    if (!this.sessionId) return;

    const wsUrl = `ws://localhost:8000/user/ws/${this.sessionId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const response: WebSocketResponse = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(response);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  public setMessageHandler(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const websocketManager = new WebSocketManager();

export const useWebSocket = () => {
  return {
    connect: (sessionId: string) => websocketManager.connect(sessionId),
    sendMessage: (message: WebSocketMessage) => websocketManager.sendMessage(message),
    setMessageHandler: (handler: MessageHandler) => websocketManager.setMessageHandler(handler),
    disconnect: () => websocketManager.disconnect(),
  };
};
