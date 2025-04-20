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
import { setSelectedTemplate, setTemplate, setTemplates } from "@/store/slices/templateSlice";
import { setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { setScreen } from "@/store/slices/sessionSlice";
import { setSelectedVisit } from "@/store/slices/visitSlice";

export default function Page() {
  const dispatch = useDispatch();
  const { connect } = useWebSocket();

  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);

  useEffect(() => {
    const createVisitHandler = handle("create_visit", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing create_visit in dashboard");
        dispatch(setVisits([...visits, data.data]));
      }
    });

    const updateVisitHandler = handle("update_visit", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing update_visit in dashboard");
        dispatch(setVisit(data.data));
      }
    });

    const deleteVisitHandler = handle("delete_visit", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing delete_visit in dashboard");
        dispatch(setVisits(visits.filter((visit) => visit.visit_id !== data.data.visit_id)));
      }
    });

    return () => {
      createVisitHandler();
      updateVisitHandler();
      deleteVisitHandler();
    };
  }, [visits]);

  useEffect(() => {
    const createTemplateHandler = handle("create_template", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing create_template in dashboard");
        dispatch(setTemplates([...templates, data.data]));
      }
    });

    const updateTemplateHandler = handle("update_template", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing update_template in dashboard");
        dispatch(setTemplate(data.data));
      }
    });

    const deleteTemplateHandler = handle("delete_template", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing delete_template in dashboard");
        dispatch(setTemplates(templates.filter((template) => template.template_id !== data.data.template_id)));
      }
    });

    return () => {
      createTemplateHandler();
      updateTemplateHandler();
      deleteTemplateHandler();
    };
  }, [templates]);

  useEffect(() => {
    connect(session.session_id);

    apiGetUser(session.session_id).then((user) => {
      dispatch(setUser(user));
    });

    apiGetUserTemplates(session.session_id).then((templates) => {
      dispatch(setTemplates(templates));
    });

    apiGetUserVisits(session.session_id).then((visits) => {
      dispatch(setVisits(visits));
    });
  }, []);

  useEffect(() => {
    if (visits.length < 1) {
      dispatch(setScreen("ACCOUNT"));
    }
  }, [visits]);

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
