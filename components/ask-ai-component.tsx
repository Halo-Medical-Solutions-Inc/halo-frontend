"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { setScreen } from "@/store/slices/sessionSlice";
import { Sparkles, FileText, Edit, MessageCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNextStep } from "nextstepjs";
import { useDispatch, useSelector } from "react-redux";
import { useChat } from "@/lib/chat";
import { RootState } from "@/store/store";
import { getUserInitials } from "@/lib/utils";

export default function AskAIComponent() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);

  const { startNextStep, setCurrentStep } = useNextStep();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultInstructions = useMemo(() => {
    let instructions = `You are an AI chatbot assistant for Halo, an AI medical scribe platform. Your primary function is to assist healthcare providers by answering specific questions about patient visits based on the information provided to you.

General guidelines for your responses:
- Provide direct, concise answers to questions about the current patient visit
- Only respond with relevant information from the visit context
- Keep responses brief and focused only on the question asked
- Provide medical advice based on the visit information when requested
- Respond with "I can't answer that" for any questions not related to the medical field
- Keep all answers specific and short
- Format your responses for readability. Use formatting when helpful: italic (surround with //), underline (surround with --), and bold (surround with **) for important points.

The user you are assisting is a healthcare provider named <user_name>${user?.name}</user_name>.`;

    if ((screen === "NOTE" || screen === "RECORD") && selectedVisit) {
      instructions += `

You have access to the following patient visit information:
<visit_info>
- Visit Name: ${selectedVisit.name}
- Additional Context: ${selectedVisit.additional_context || "None"}
${selectedVisit.transcript ? `- Transcript: ${selectedVisit.transcript}` : ""}
${selectedVisit.note ? `- Note: ${selectedVisit.note}` : ""}
</visit_info>

Only answer questions related to this specific patient visit using the information provided in the visit_info tags. You may provide relevant medical advice based on this information, but for any non-medical questions or anything not contained in this information, respond with "I can't answer that."
`;
    } else {
      instructions += `

No specific patient visit is currently selected. You can only answer general questions about using Halo as a medical scribe platform or general medical questions. For specific patient information, inform the user that they will need to select a visit first. For any questions not related to the medical field, respond with "I can't answer that."
`;
    }

    instructions += `Give a clear, concise answer to the question. Do not add extra clutter to the beginning of your response, nor add a closing statement.`;

    return instructions;
  }, [user?.name, screen, selectedVisit]);

  const { messages, connected, loading, messageStream, connect, disconnect, send, reset } = useChat({
    defaultInstructions,
    onError: (error) => console.error("Chat error:", error),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messageStream.content]);

  useEffect(() => {
    if (isChatMode) {
      reset();
      connect();
    } else {
      disconnect();
    }
  }, [isChatMode]);

  useEffect(() => {
    if (!loading && connected && isChatMode) {
      inputRef.current?.focus();
    }
  }, [loading, connected, isChatMode]);

  const handleTutorialClick = (tutorial: string) => {
    if (tutorial === "template-tour") {
      dispatch(setScreen("TEMPLATES"));
      startNextStep("template-tour");
      setTimeout(() => setCurrentStep(0), 1000);
      setIsChatOpen(false);
      return;
    }
    if (tutorial === "chat-tour") {
      setIsChatMode(true);
      return;
    }
    startNextStep(tutorial);
    setTimeout(() => setCurrentStep(0), 1000);
    setIsChatOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !connected || loading) return;

    try {
      await send(inputValue.trim());
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ExpandableChat size={isChatMode ? "sm" : "fit"} position="bottom-right" icon={<Sparkles className="h-4 w-4" />} open={isChatOpen} onOpenChange={setIsChatOpen}>
      <ExpandableChatHeader className="flex-col text-center justify-center">
        {isChatMode ? (
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="icon" onClick={() => setIsChatMode(false)} className="">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-md font-semibold">Chat with AI ✨</h1>
              <p className="text-sm text-muted-foreground">{connected ? "Ask me anything about the app" : "Connecting..."}</p>
            </div>
            <div className="w-8"></div>
          </div>
        ) : (
          <>
            <h1 className="text-md font-semibold">How to use Halo ✨</h1>
            <p className="text-sm text-muted-foreground">Quick start guide in under 2 minutes</p>
          </>
        )}
      </ExpandableChatHeader>

      <ExpandableChatBody>
        {isChatMode ? (
          <ChatMessageList>
            {messages.length === 0 && connected && <div className="text-center text-xs text-muted-foreground p-4">Start a conversation by typing a message below</div>}
            {messages.map((message) => (
              <ChatBubble key={message.id} variant={message.sender === "user" ? "sent" : "received"}>
                <ChatBubbleAvatar className="h-8 w-8 shrink-0" fallback={message.sender === "user" ? getUserInitials(user!) : "AI"} />
                <ChatBubbleMessage className="text-xs" variant={message.sender === "user" ? "sent" : "received"}>
                  {message.id === messageStream.id ? messageStream.content || <Loader2 className="h-4 w-4 animate-spin" /> : message.content}
                </ChatBubbleMessage>
              </ChatBubble>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessageList>
        ) : (
          <div className="space-y-2 p-4">
            <button key="visit-tour" className="w-full flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-left mb-2" onClick={() => handleTutorialClick("visit-tour")}>
              <div>
                <h3 className="text-xs font-semibold text-primary">Start a Visit</h3>
                <p className="text-xs text-muted-foreground">Create, record, and complete a visit.</p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </button>
            <button key="template-tour" className="w-full flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-left mb-2" onClick={() => handleTutorialClick("template-tour")}>
              <div>
                <h3 className="text-xs font-semibold text-primary">Create a Template</h3>
                <p className="text-xs text-muted-foreground">Build custom formats for your notes.</p>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
            {screen === "NOTE" && selectedVisit && (
              <button key="chat-tour" className="w-full flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-left" onClick={() => handleTutorialClick("chat-tour")}>
                <div>
                  <h3 className="text-xs font-semibold text-primary">Chat with AI</h3>
                  <p className="text-xs text-muted-foreground">Ask questions and get answers.</p>
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </ExpandableChatBody>

      {isChatMode && (
        <ExpandableChatFooter className="border-t-0">
          <div className="relative rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
            <div className="flex items-center gap-2">
              <Input ref={inputRef} placeholder={connected ? "Type your message..." : "Connecting to chat..."} className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0 flex-1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} disabled={!connected || loading} />
              <Button size="icon" className="mr-2 gap-1.5" onClick={handleSendMessage} disabled={!inputValue.trim() || !connected || loading}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </ExpandableChatFooter>
      )}
    </ExpandableChat>
  );
}
