"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import AskAIComponent from "@/components/ask-ai-component";
import { Visit, Template } from "@/store/types";
import { setUser } from "@/store/slices/userSlice";
import { setSelectedTemplate, setTemplates } from "@/store/slices/templateSlice";
import { setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { setScreen } from "@/store/slices/sessionSlice";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import { clearSelectedTemplate } from "@/store/slices/templateSlice";

export default function Page() {
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);
  const { connect } = useWebSocket();

  useEffect(() => {
    handle("create_template", (data) => {
      dispatch(setTemplates([...templates, data.data as Template]));
      if (data.was_requested) {
        dispatch(setSelectedTemplate(data.data as Template));
        dispatch(setScreen("TEMPLATE"));
      }
    });
    handle("delete_template", (data) => {
      dispatch(setTemplates(templates.filter((template) => template._id !== data.data.template_id)));
      if (data.was_requested) {
        dispatch(clearSelectedTemplate());
        dispatch(setScreen("TEMPLATES"));
      }
    });
  }, [templates]);

  useEffect(() => {
    handle("create_visit", (data) => {
      dispatch(setVisits([...visits, data.data as Visit]));
      if (data.was_requested) {
        dispatch(setSelectedVisit(data.data as Visit));
        dispatch(setScreen("RECORD"));
      }
    });

    handle("delete_visit", (data) => {
      dispatch(setVisits(visits.filter((visit) => visit._id !== data.data.visit_id)));
      const remainingVisits = visits.filter((visit) => visit._id !== data.data.visit_id);
      if (remainingVisits.length > 0) {
        const latestVisit = [...remainingVisits].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
        dispatch(setSelectedVisit(latestVisit));
      }
    });
  }, [visits]);

  useEffect(() => {
    handle("update_visit", (data) => {
      dispatch(setVisit(data.data as Visit));
    });

    handle("update_template", (data) => {
      dispatch(setSelectedTemplate(data.data as Template));
    });
  }, []);

  useEffect(() => {
    connect(session._id);

    apiGetUser(session._id).then((user) => {
      dispatch(setUser(user));
    });

    apiGetUserTemplates(session._id).then((templates) => {
      dispatch(setTemplates(templates));
    });

    apiGetUserVisits(session._id).then((visits) => {
      dispatch(setVisits(visits));
    });

    if (visits.length > 0) {
      dispatch(setSelectedVisit(visits[visits.length - 1]));
      dispatch(setScreen("RECORD"));
    } else {
      dispatch(setScreen("ACCOUNT"));
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
