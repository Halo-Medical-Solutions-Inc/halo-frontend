"use client";

import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChevronRight, Sparkles, FileText, Edit, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNextStep } from "nextstepjs";

export default function AskAIComponent() {
  const { startNextStep, setCurrentStep } = useNextStep();

  const handleTutorialClick = (tutorial: string) => {
    if (tutorial === "onboarding") {
      startNextStep("onboarding");
      //add delay
      setTimeout(() => {
        setCurrentStep(0, 100);
      }, 1000);
    }
    // Other tutorials will be implemented later
  };

  const TutorialOption = ({ title, subtitle, icon: Icon, onClick }: { title: string; subtitle: string; icon: any; onClick: () => void }) => (
    <div className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
      <div>
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );

  return (
    <ExpandableChat size="fit" position="bottom-right" icon={<Sparkles className="h-4 w-4" />}>
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Tutorials & Help ✨</h1>
        <p className="text-sm text-muted-foreground font-normal">Choose a tutorial to get started</p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <div className="space-y-2 p-4">
          <TutorialOption title="Creating Visit" subtitle="Learn how to create and manage visits" icon={FileText} onClick={() => handleTutorialClick("visit")} />
          <TutorialOption title="Modifying Template" subtitle="Learn how to customize templates" icon={Edit} onClick={() => handleTutorialClick("template")} />
          <TutorialOption title="Onboarding" subtitle="Complete the full onboarding process" icon={GraduationCap} onClick={() => handleTutorialClick("onboarding")} />
        </div>
      </ExpandableChatBody>
    </ExpandableChat>
  );
}
