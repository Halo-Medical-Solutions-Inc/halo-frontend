"use client";

import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AskAIComponent() {
  // Static fake data
  const messages = [
    {
      id: 1,
      content: "Hello! How can I help you today?",
      sender: "ai",
    },
    {
      id: 2,
      content: "I have a question about the component library.",
      sender: "user",
    },
    {
      id: 3,
      content: "Sure! I'd be happy to help. What would you like to know?",
      sender: "ai",
    },
    {
      id: 4,
      content: "How do I create a new template?",
      sender: "user",
    },
    {
      id: 5,
      content: "Creating a new template is easy! Navigate to the Templates section from the sidebar, then click the 'Create Template' button. You'll be guided through a simple form to set up your template.",
      sender: "ai",
    },
  ];

  return (
    <div className="h-[600px] relative">
      <ExpandableChat size="sm" position="bottom-right" icon={<Sparkles className="h-4 w-4" />}>
        <ExpandableChatHeader className="flex-col text-center justify-center">
          <h1 className="text-xl font-semibold">Chat with AI ✨</h1>
          <p className="text-sm text-muted-foreground font-normal">Ask me anything about the app</p>
        </ExpandableChatHeader>

        <ExpandableChatBody>
          <ChatMessageList>
            {messages.map((message) => (
              <ChatBubble key={message.id} variant={message.sender === "user" ? "sent" : "received"}>
                <ChatBubbleAvatar className="h-8 w-8 shrink-0" fallback={message.sender === "user" ? "US" : "AI"} />
                <ChatBubbleMessage variant={message.sender === "user" ? "sent" : "received"}>{message.content}</ChatBubbleMessage>
              </ChatBubble>
            ))}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter className="border-t-0">
          <div className="relative rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
            <div className="flex items-center gap-2">
              <Input placeholder="Type your message..." className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0 flex-1" />
              <Button size="icon" className="mr-2 gap-1.5">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
