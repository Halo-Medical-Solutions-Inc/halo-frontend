"use client";

import { useState } from "react";
import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from "@/components/ui/expandable-chat";
import { setScreen } from "@/store/slices/sessionSlice";
import { Sparkles, FileText, Edit, GraduationCap } from "lucide-react";
import { useNextStep } from "nextstepjs";
import { useDispatch } from "react-redux";
 
export default function AskAIComponent() {
  const dispatch = useDispatch();
  const { startNextStep, setCurrentStep } = useNextStep();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleTutorialClick = (tutorial: string) => {
    if (tutorial === "template-tour") {
      dispatch(setScreen("TEMPLATES"));
    }
    startNextStep(tutorial);
    setTimeout(() => {
      setCurrentStep(0);
    }, 1000);
    setIsChatOpen(false);
  };

  const TutorialOption = ({ title, subtitle, icon: Icon, onClick }: { title: string; subtitle: string; icon: any; onClick: () => void }) => (
    <div className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
      <div>
        <h3 className="text-xs font-semibold text-primary">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );

  return (
    <ExpandableChat size="fit" position="bottom-right" icon={<Sparkles className="h-4 w-4" />} open={isChatOpen} onOpenChange={setIsChatOpen}>
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-md font-semibold">How to use Halo ✨</h1>
        <p className="text-sm text-muted-foreground">Quick start guide in under 2 minutes</p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <div className="space-y-2 p-4">
          <TutorialOption title="Start a Visit" subtitle="Create, record, and complete a visit." icon={FileText} onClick={() => handleTutorialClick("visit-tour")} />
          <TutorialOption title="Create a Template" subtitle="Build custom formats for your notes." icon={Edit} onClick={() => handleTutorialClick("template-tour")} />
        </div>
      </ExpandableChatBody>
    </ExpandableChat>
  );
}
