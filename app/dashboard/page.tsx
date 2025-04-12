"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import AskAIComponent from "@/components/ask-ai-component";

export default function Page() {

  return (
    <Application>
      <SidebarComponent />
      {/* <AccountComponent /> */}
      <NoteComponent />
      {/* <RecordComponent /> */}
      {/* <TemplateComponent /> */}
      {/* <TemplatesComponent /> */}
      <AskAIComponent />
    </Application>
  );
}
