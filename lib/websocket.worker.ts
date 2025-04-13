let ws: WebSocket | null = null;
let sessionId: string | null = null;

self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "CONNECT":
      sessionId = data;
      initializeWebSocket();
      break;
    case "SEND":
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
      break;
    case "DISCONNECT":
      if (ws) {
        ws.close();
        ws = null;
      }
      break;
  }
};

function initializeWebSocket() {
  if (!sessionId) return;

  const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    self.postMessage({ type: "CONNECTED" });
  };

  ws.onmessage = (event) => {
    self.postMessage({ type: "MESSAGE", data: JSON.parse(event.data) });
  };

  ws.onclose = () => {
    self.postMessage({ type: "DISCONNECTED" });
    setTimeout(initializeWebSocket, 1000);
  };

  ws.onerror = (error) => {
    self.postMessage({ type: "ERROR", data: error });
  };
}
