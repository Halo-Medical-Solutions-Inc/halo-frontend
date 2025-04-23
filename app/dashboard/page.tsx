"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import { clearUser, setUser } from "@/store/slices/userSlice";
import { clearSelectedTemplate, setTemplate, setTemplates } from "@/store/slices/templateSlice";
import { clearSelectedVisit, setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { clearSession, setScreen } from "@/store/slices/sessionSlice";

export default function Page() {
  const dispatch = useDispatch();
  const { connect } = useWebSocket();

  const user = useSelector((state: RootState) => state.user.user);
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
      console.log("Processing update_template in dashboard");
      dispatch(setTemplate(data.data));
    });

    const deleteTemplateHandler = handle("delete_template", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing delete_template in dashboard");
        dispatch(setTemplates(templates.filter((template) => template.template_id !== data.data.template_id)));
      }
    });

    const duplicateTemplateHandler = handle("duplicate_template", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing duplicate_template in dashboard");
        dispatch(setTemplates([...templates, data.data]));
      }
    });

    return () => {
      createTemplateHandler();
      updateTemplateHandler();
      deleteTemplateHandler();
      duplicateTemplateHandler();
    };
  }, [templates]);

  useEffect(() => {
    const updateUserHandler = handle("update_user", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing update_user in dashboard");
        dispatch(setUser(data.data));
      }
    });

    const errorHandler = handle("error", "dashboard", (data) => {
      if (data.was_requested && data.data.message === "Session expired") {
        dispatch(clearSelectedTemplate());
        dispatch(clearSelectedVisit());
        dispatch(clearUser());
        dispatch(clearSession());
        window.location.href = "/signin";
      }
    });

    return () => {
      updateUserHandler();
      errorHandler();
    };
  }, [user]);

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
    </Application>
  );
}
