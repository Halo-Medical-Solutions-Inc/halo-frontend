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
import { clearSelectedVisit, setSelectedVisit, setVisit, setVisits } from "@/store/slices/visitSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState } from "@/store/store";
import useWebSocket, { handle } from "@/lib/websocket";
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits } from "@/store/api";
import { clearSession, setScreen } from "@/store/slices/sessionSlice";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNextStep } from "nextstepjs";

export default function Page() {
  const dispatch = useDispatch();
  const { connect } = useWebSocket();
  const { startNextStep } = useNextStep();

  const user = useSelector((state: RootState) => state.user.user);
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const createVisitHandler = handle("create_visit", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing create_visit in dashboard");
        dispatch(setVisits([...visits, data.data]));
      }
    });

    const updateVisitHandler = handle("update_visit", "dashboard", (data) => {
      console.log("Data updated", data.data);
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

    const startRecordingHandler = handle("start_recording", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing start_recording in dashboard");
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
        dispatch(setVisit(data.data));
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing pause_recording in dashboard");
        dispatch(setVisit(data.data));
      }
    });

    const resumeRecordingHandler = handle("resume_recording", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing resume_recording in dashboard");
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
        dispatch(setVisit(data.data));
      }
    });

    const finishRecordingHandler = handle("finish_recording", "dashboard", (data) => {
      if (!data.was_requested) {
        console.log("Processing finish_recording in dashboard");
        dispatch(setVisit(data.data));
      }
    });

    const noteGeneratedHandler = handle("note_generated", "dashboard", (data) => {
      // console.log("Processing note_generated in dashboard");
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
      console.log("Processing error in dashboard, data:", data);
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
      apiGetUser(session.session_id).then((user) => {
        dispatch(setUser(user));
      }),
      apiGetUserTemplates(session.session_id).then((templates) => {
        dispatch(setTemplates(templates));
      }),
      apiGetUserVisits(session.session_id).then((visits) => {
        dispatch(setVisits(visits));
        const lastNonRecordingVisit = [...visits].reverse().find((visit) => visit.status !== "RECORDING");
        if (lastNonRecordingVisit) {
          dispatch(setSelectedVisit(lastNonRecordingVisit));
          dispatch(setScreen(lastNonRecordingVisit.status === "FINISHED" || lastNonRecordingVisit.status === "GENERATING_NOTE" ? "NOTE" : "RECORD"));
        }
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

  const startOnboarding = () => {
    startNextStep("onboarding");
  };

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
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={() => {
              startNextStep("onboardingTour");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <button onClick={startOnboarding} className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg hover:bg-primary/90 transition-colors">
          Start Onboarding
        </button>
      </Application>
    </>
  );
}
