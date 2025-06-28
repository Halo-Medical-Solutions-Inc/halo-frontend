"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { setScreen } from "@/store/slices/sessionSlice";
import { Sparkles, FileText, Edit, MessageCircle, ChevronRight, ChevronLeft, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNextStep } from "nextstepjs";
import { useDispatch, useSelector } from "react-redux";
import { useChat } from "@/lib/chat";
import { RootState } from "@/store/store";
import { getUserInitials } from "@/lib/utils";
import { apiAskChat } from "@/store/api";

type ComponentMode = "tutorials" | "chat" | "patient-summary";

export default function AskAIComponent() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);

  const { startNextStep, setCurrentStep } = useNextStep();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ComponentMode>("tutorials");
  const [inputValue, setInputValue] = useState("");
  const [patientSummary, setPatientSummary] = useState<string>("");
  const [fetchingPatientSummary, setFetchingPatientSummary] = useState(false);

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
    if (mode === "chat") {
      reset();
      connect();
    } else {
      disconnect();
    }
  }, [mode]);

  useEffect(() => {
    if (!loading && connected && mode === "chat") {
      inputRef.current?.focus();
    }
  }, [loading, connected, mode]);

  useEffect(() => {
    setIsOpen(false);
    setMode("tutorials");
  }, [selectedVisit]);

  const fetchPatientSummary = async (): Promise<boolean> => {
    if (!selectedVisit || !session?.session_id) return false;

    setFetchingPatientSummary(true);
    try {
      const message = `
You are an AI medical scribe preparing a pre-chart summary for a physician before they enter the exam room. Your job is to provide a structured, concise, and clinically meaningful snapshot of the patient's history and recent activity, based on the patient's record.

**Your objective is to reduce the physician's cognitive load and surface relevant context for the upcoming encounter.**

Here is the available patient data:
${selectedVisit.additional_context || "No additional context available"}
${selectedVisit.note ? `Note: ${selectedVisit.note}` : ""}

YOU MUST follow this EXACT format and structure with clear headings and sections. Use //italics// for important medical terms and conditions, and --underlines-- for critical alerts or urgent items:

=========================
**Patient:** ${selectedVisit.name} | **DOB:** [MM/DD/YYYY or Unknown] | [Age or Unknown] [Sex or Unknown]  
**Visit Date:** [MM/DD/YYYY or Today] | **Provider:** [Name or Unknown] | **Type:** [Visit type: New / F/U / Annual / etc. or Unknown]

**Chief Complaint:**  
[Short summary of reason for visit or concern as recorded or inferred]

**HPI Summary:**  
[1-3 sentence narrative describing the history of present illness, relevant symptoms, duration, progression, and recent care activity]

**Problem List:**  
- [Problem 1] – [Status: stable/worsening/recently diagnosed/etc.]  
- [Problem 2] – [relevant note]  
*(Only include relevant or active problems)*

**Medications:**  
[List relevant medications and dosages, or "Not documented"]

**Allergies:**  
[List with reactions, e.g., Penicillin – hives, or "Not documented"]

**Vitals (Most Recent):**  
BP: [ ], HR: [ ], Temp: [ ], Wt: [ ] lb, Ht: [ ] in  
*[Include trends if relevant, or "Not documented"]*

**Recent Labs & Imaging:**  
- [Test name]: [Date] – [Result summary]  
*(Past ~6 months, or "None documented")*

**Pending / Follow-Ups:**  
- [Items needing follow-up: referrals, labs, care gaps, or "None identified"]

**Social & Other Notes:**  
[Language needs, adherence issues, psychosocial context, SDoH, or "None documented"]

=========================

CRITICAL FORMATTING REQUIREMENTS:
- MAINTAIN ALL SECTION HEADERS EXACTLY AS SHOWN ABOVE
- DO NOT combine sections or create paragraph summaries
- Each section must have its own clear heading (**Section Name:**)
- Use bullet points (-) for lists within sections
- Keep each section concise but clearly separated
- DO NOT write a single paragraph summary - use the structured format with headings
- DO NOT include boilerplate text or introductory statements
- DO NOT hallucinate data - only use information provided
- If information is missing, use "Unknown", "Not documented", or "None documented"
- Use //italics// for medical conditions/terms, --underlines-- for critical alerts
- Total length under ~300 words but MUST maintain all section headers`;
      const response = await apiAskChat(session.session_id, message);
      setPatientSummary(response);
      return true;
    } catch (error) {
      console.error("Failed to fetch patient summary:", error);
      setPatientSummary("Failed to load patient summary. Please try again.");
      return false;
    } finally {
      setFetchingPatientSummary(false);
    }
  };

  const parseFormattedText = (text: string): React.ReactNode[] => {
    if (typeof text !== "string") return [text];

    const parts: React.ReactNode[] = [];
    let currentIndex = 0,
      partIndex = 0;
    const formatRegex = /(\*\*|\/\/|--)(.*?)\1/g;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      if (match.index > currentIndex) parts.push(text.slice(currentIndex, match.index));

      const marker = match[1];
      const nestedContent = parseNestedFormatting(match[2]);

      if (marker === "**") parts.push(<strong key={`bold-${partIndex++}`}>{nestedContent}</strong>);
      else if (marker === "//") parts.push(<em key={`italic-${partIndex++}`}>{nestedContent}</em>);
      else if (marker === "--") parts.push(<u key={`underline-${partIndex++}`}>{nestedContent}</u>);

      currentIndex = match.index + match[0].length;
    }

    if (currentIndex < text.length) parts.push(text.slice(currentIndex));
    return parts.length > 0 ? parts : [text];
  };

  const parseNestedFormatting = (text: string): React.ReactNode => {
    const formatRegex = /(\*\*|\/\/|--)(.*?)\1/g;
    const parts: React.ReactNode[] = [];
    let currentIndex = 0,
      partIndex = 0;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      if (match.index > currentIndex) parts.push(text.slice(currentIndex, match.index));

      const marker = match[1],
        content = match[2];
      if (marker === "**") parts.push(<strong key={`nested-bold-${partIndex++}`}>{content}</strong>);
      else if (marker === "//") parts.push(<em key={`nested-italic-${partIndex++}`}>{content}</em>);
      else if (marker === "--") parts.push(<u key={`nested-underline-${partIndex++}`}>{content}</u>);

      currentIndex = match.index + match[0].length;
    }

    if (currentIndex < text.length) parts.push(text.slice(currentIndex));
    return parts.length > 0 ? parts : text;
  };

  const handleTutorialClick = (tutorial: string) => {
    if (tutorial === "template-tour") {
      dispatch(setScreen("TEMPLATES"));
      startNextStep("template-tour");
      setTimeout(() => setCurrentStep(0), 1000);
      setIsOpen(false);
      return;
    }
    if (tutorial === "chat-tour") {
      setMode("chat");
      setPatientSummary("");
      setFetchingPatientSummary(false);
      return;
    }
    if (tutorial === "patient-summary") {
      fetchPatientSummary().then((success) => {
        if (success) {
          setMode("patient-summary");
        }
      });
      return;
    }
    startNextStep(tutorial);
    setTimeout(() => setCurrentStep(0), 1000);
    setIsOpen(false);
  };

  const handleBackToTutorials = () => {
    setMode("tutorials");
    setPatientSummary("");
    setFetchingPatientSummary(false);
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

  const renderHeader = () => {
    switch (mode) {
      case "chat":
        return (
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="icon" onClick={handleBackToTutorials}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-md font-semibold">Chat with AI ✨</h1>
              <p className="text-sm text-muted-foreground">{connected ? "Ask me anything about the app" : "Connecting..."}</p>
            </div>
            <div className="w-8"></div>
          </div>
        );
      case "patient-summary":
        return (
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="icon" onClick={handleBackToTutorials}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-md font-semibold">{selectedVisit?.name || "New Visit"}</h1>
              <p className="text-sm text-muted-foreground">Visit Summary</p>
            </div>
            <div className="w-8"></div>
          </div>
        );
      default:
        return (
          <>
            <h1 className="text-md font-semibold">How to use Halo ✨</h1>
            <p className="text-sm text-muted-foreground">Quick start guide in under 2 minutes</p>
          </>
        );
    }
  };

  const renderBody = () => {
    switch (mode) {
      case "chat":
        return (
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
        );
      case "patient-summary":
        return (
          <div className="p-4">
            {patientSummary ? (
              <div className="text-sm whitespace-pre-wrap">{parseFormattedText(patientSummary)}</div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No patient summary available</p>
                <p className="text-xs mt-2">Please select a visit to view summary</p>
              </div>
            )}
          </div>
        );
      default:
        return (
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
            {(screen === "NOTE" || screen === "RECORD") && selectedVisit && (
              <>
                <button key="patient-summary" className="w-full flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-left mb-2" onClick={() => handleTutorialClick("patient-summary")} disabled={fetchingPatientSummary}>
                  <div>
                    <h3 className="text-xs font-semibold text-primary">View Patient Summary</h3>
                    <p className="text-xs text-muted-foreground">Quick overview of patient information.</p>
                  </div>
                  {fetchingPatientSummary ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /> : <User className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button key="chat-tour" className="w-full flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors text-left" onClick={() => handleTutorialClick("chat-tour")}>
                  <div>
                    <h3 className="text-xs font-semibold text-primary">Chat with AI</h3>
                    <p className="text-xs text-muted-foreground">Ask questions and get answers.</p>
                  </div>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <ExpandableChat size={mode !== "tutorials" ? "sm" : "fit"} position="bottom-right" icon={<Sparkles className="h-4 w-4" />} open={isOpen} onOpenChange={setIsOpen}>
      <ExpandableChatHeader className="flex-col text-center justify-center">{renderHeader()}</ExpandableChatHeader>

      <ExpandableChatBody>{renderBody()}</ExpandableChatBody>

      {mode === "chat" && (
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
