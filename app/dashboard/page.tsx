"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import AskAIComponent from "@/components/ask-ai-component";
import { initialUserState, initialTemplateState, initialVisitState } from "@/store/types";
import { setUser } from "@/store/slices/userSlice";
import { setTemplates } from "@/store/slices/templateSlice";
import { setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";

export default function Page() {
  const dispatch = useDispatch();
  const screen = useSelector((state: RootState) => state.session.screen);

  useEffect(() => {
    if (initialUserState.user) {
      dispatch(setUser(initialUserState.user));
    }
    if (initialTemplateState.templates) {
      dispatch(setTemplates(initialTemplateState.templates));
    }
    if (initialVisitState.visits) {
      dispatch(setVisits(initialVisitState.visits));
    }
  }, []);

  return (
    <Application>
      <SidebarComponent />
      {screen === "ACCOUNT" && <AccountComponent />}
      {screen === "NOTE" && <NoteComponent />}
      {screen === "RECORD" && <RecordComponent />}
      {screen === "TEMPLATE" && <TemplateComponent />}
      {screen === "TEMPLATES" && <TemplatesComponent />}
      <AskAIComponent />
    </Application>
  );
}
