import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatConfig {
  sessionId: string;
  onError?: (error: Error) => void;
}

export function useChat(config: ChatConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const messageCounterRef = useRef(0);
  const isConnectingRef = useRef(false);

  const generateId = () => `msg-${Date.now()}-${++messageCounterRef.current}`;

  const connect = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current?.close();
    isConnectingRef.current = true;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_CHAT_URL;
      if (!backendUrl) throw new Error("Chat URL not configured");

      const ws = new WebSocket(`${backendUrl}/${config.sessionId}`);

      ws.onopen = () => {
        setIsConnected(true);
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "chunk") {
          setCurrentStreamingMessage(data.content);
        } else if (data.type === "complete") {
          const streamingId = streamingIdRef.current;
          if (streamingId) {
            setMessages((prev) => [...prev.filter((m) => m.id !== streamingId), { id: streamingId, content: data.content, sender: "ai", timestamp: new Date() }]);
            setCurrentStreamingMessage("");
            streamingIdRef.current = null;
            setIsLoading(false);
          }
        } else if (data.type === "error") {
          config.onError?.(new Error(data.message));
          setIsLoading(false);
          setCurrentStreamingMessage("");
          streamingIdRef.current = null;
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        isConnectingRef.current = false;
        config.onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = () => {
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      wsRef.current = ws;
    } catch (error) {
      isConnectingRef.current = false;
      config.onError?.(error as Error);
    }
  }, [config.sessionId, config.onError]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
      }

      const userMessage: Message = {
        id: generateId(),
        content,
        sender: "user",
        timestamp: new Date(),
      };

      const aiMessageId = generateId();
      streamingIdRef.current = aiMessageId;

      setMessages((prev) => [...prev, userMessage, { id: aiMessageId, content: "", sender: "ai", timestamp: new Date() }]);
      setIsLoading(true);
      setCurrentStreamingMessage("");

      const chatHistory = [...messages, userMessage].map((msg) => `${msg.sender}: ${msg.content}`).join("\n") + `\nuser: ${content}`;

      wsRef.current.send(JSON.stringify({ message: chatHistory }));
    },
    [messages]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentStreamingMessage("");
    streamingIdRef.current = null;
    setIsLoading(false);
    messageCounterRef.current = 0;
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    messages,
    connected: isConnected,
    loading: isLoading,
    messageStream: {
      content: currentStreamingMessage,
      id: streamingIdRef.current,
    },
    connect,
    disconnect,
    send: sendMessage,
    reset: resetChat,
  };
}
