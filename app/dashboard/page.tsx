"use client";

import { Application } from "@/components/ui/sidebar";
import AccountComponent from "@/components/account-component";
import SidebarComponent from "@/components/sidebar-component";
import NoteComponent from "@/components/note-component";
import RecordComponent from "@/components/record-component";
import TemplateComponent from "@/components/template-component";
import TemplatesComponent from "@/components/templates-component";
import { clearUser, setUser } from "@/store/slices/userSlice";
import { clearSelectedTemplate, setSelectedTemplate, setTemplate, setTemplates } from "@/store/slices/templateSlice";
import { clearSelectedVisit, setSelectedVisit, setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { clearSession, setScreen } from "@/store/slices/sessionSlice";
import { Loader2 } from "lucide-react";
import { Template } from "@/store/types";
import AskAIComponent from "@/components/ask-ai-component";

export default function Page() {
  const dispatch = useDispatch();
  const { connect } = useWebSocket();

  const user = useSelector((state: RootState) => state.user.user);
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const createVisitHandler = handle("create_visit", "dashboard", (data) => {
      dispatch(setVisits([...visits, data.data]));

      if (data.was_requested) {
        dispatch(setSelectedVisit(data.data));
        dispatch(setScreen("RECORD"));
      }
    });

    const updateVisitHandler = handle("update_visit", "dashboard", (data) => {
      dispatch(setVisit(data.data));
    });

    const deleteVisitHandler = handle("delete_visit", "dashboard", (data) => {
      dispatch(setVisits(visits.filter((visit) => visit.visit_id !== data.data.visit_id)));

      if (selectedVisit?.visit_id === data.data.visit_id) {
        dispatch(clearSelectedVisit());
        dispatch(setScreen("ACCOUNT"));
      }
    });

    const startRecordingHandler = handle("start_recording", "dashboard", (data) => {
      dispatch(setVisit(data.data));

      if (!data.was_requested) {
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "dashboard", (data) => {
      dispatch(setVisit(data.data));
    });

    const resumeRecordingHandler = handle("resume_recording", "dashboard", (data) => {
      dispatch(setVisit(data.data));

      if (!data.was_requested) {
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
      }
    });

    const finishRecordingHandler = handle("finish_recording", "dashboard", (data) => {
      dispatch(setVisit(data.data));

      if (selectedVisit?.visit_id == data.data.visit_id) {
        dispatch(setVisit({ ...data.data, status: "FRONTEND_TRANSITION" }));
        dispatch(setScreen("NOTE"));
      }
    });

    const noteGeneratedHandler = handle("note_generated", "dashboard", (data) => {
      dispatch(setVisit(data.data));
    });

    return () => {
      createVisitHandler();
      updateVisitHandler();
      deleteVisitHandler();
      startRecordingHandler();
      pauseRecordingHandler();
      resumeRecordingHandler();
      finishRecordingHandler();
      noteGeneratedHandler();
    };
  }, [visits, selectedVisit]);

  useEffect(() => {
    const createTemplateHandler = handle("create_template", "dashboard", (data) => {
      dispatch(setTemplates([...templates, data.data]));

      if (data.was_requested) {
        dispatch(setSelectedTemplate(data.data as Template));
        dispatch(setScreen("TEMPLATE"));
      }
    });

    const updateTemplateHandler = handle("update_template", "dashboard", (data) => {
      dispatch(setTemplate(data.data));
    });

    const deleteTemplateHandler = handle("delete_template", "dashboard", (data) => {
      dispatch(setTemplates(templates.filter((template) => template.template_id !== data.data.template_id)));

      if (screen === "TEMPLATE") {
        if (selectedTemplate?.template_id === data.data.template_id) {
          dispatch(clearSelectedTemplate());
          dispatch(setScreen("TEMPLATES"));
        }
      }
    });

    const duplicateTemplateHandler = handle("duplicate_template", "dashboard", (data) => {
      dispatch(setTemplates([...templates, data.data]));
    });

    const templateGeneratedHandler = handle("template_generated", "dashboard", (data) => {
      dispatch(setTemplate(data.data));
    });

    return () => {
      createTemplateHandler();
      updateTemplateHandler();
      deleteTemplateHandler();
      duplicateTemplateHandler();
      templateGeneratedHandler();
    };
  }, [templates]);

  useEffect(() => {
    const updateUserHandler = handle("update_user", "dashboard", (data) => {
      dispatch(setUser(data.data));
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
    if (!session) {
      window.location.href = "/signin";
      return;
    }

    setInitialLoad(true);
    connect(session.session_id);

    Promise.all([
      apiGetUser(session.session_id)
        .then((user) => {
          if (!user) {
            window.location.href = "/signin";
            return;
          }
          dispatch(setUser(user));
        })
        .catch(() => {
          window.location.href = "/signin";
        }),
      apiGetUserTemplates(session.session_id)
        .then((templates) => {
          if (!templates) {
            window.location.href = "/signin";
            return;
          }
          dispatch(setTemplates(templates));
        })
        .catch(() => {
          window.location.href = "/signin";
        }),
      apiGetUserVisits(session.session_id)
        .then((visits) => {
          if (!visits) {
            window.location.href = "/signin";
            return;
          }
          dispatch(setVisits(visits));
          const lastNonRecordingVisit = [...visits].reverse().find((visit) => visit.status !== "RECORDING");
          if (lastNonRecordingVisit) {
            dispatch(setSelectedVisit(lastNonRecordingVisit));
            dispatch(setScreen(lastNonRecordingVisit.status === "FINISHED" || lastNonRecordingVisit.status === "GENERATING_NOTE" ? "NOTE" : "RECORD"));
          }
        })
        .catch(() => {
          window.location.href = "/signin";
        }),
    ]).finally(() => {
      setInitialLoad(false);
    });
  }, []);

  useEffect(() => {
    if (visits.length < 1) {
      dispatch(setScreen("ACCOUNT"));
    }
  }, [visits]);

  return (
    <>
      {initialLoad && (
        <div className="fixed inset-0 bg-background/10 backdrop-blur-[4px] z-40 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <Application>
        <SidebarComponent />
        {screen === "ACCOUNT" && <AccountComponent />}
        {screen === "NOTE" && <NoteComponent />}
        {screen === "RECORD" && <RecordComponent />}
        {screen === "TEMPLATE" && <TemplateComponent />}
        {screen === "TEMPLATES" && <TemplatesComponent />}
        <AskAIComponent />
      </Application>
    </>
  );
}
