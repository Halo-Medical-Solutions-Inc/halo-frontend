"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import AskAIComponent from "@/components/ask-ai-component";
import { initialUserState, initialTemplateState, initialVisitState, Visit } from "@/store/types";
import { setUser } from "@/store/slices/userSlice";
import { setTemplate, setTemplates } from "@/store/slices/templateSlice";
import { setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";

export default function Page() {
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const { connect } = useWebSocket();

  useEffect(() => {
    connect(session._id);

    handle("update_visit", (data) => {
      dispatch(setVisit(data.data as Visit));
    });

    apiGetUser(session._id).then((user) => {
      dispatch(setUser(user));
    });

    apiGetUserTemplates(session._id).then((templates) => {
      dispatch(setTemplates(templates));
    });

    apiGetUserVisits(session._id).then((visits) => {
      dispatch(setVisits(visits));
    });
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
