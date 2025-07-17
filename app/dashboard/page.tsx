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
import { apiGetUser, apiGetUserTemplates, apiGetUserVisits, apiCheckSubscription, exchangeDrChronoCode, apiVerifyEMRIntegration } from "@/store/api";
import { clearSession, setScreen } from "@/store/slices/sessionSlice";
import { Loader2 } from "lucide-react";
import { Template } from "@/store/types";
import AskAIComponent from "@/components/ask-ai-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { connect } = useWebSocket();
  const searchParams = useSearchParams();

  const user = useSelector((state: RootState) => state.user.user);
  const session = useSelector((state: RootState) => state.session.session);
  const screen = useSelector((state: RootState) => state.session.screen);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);

  const [initialLoad, setInitialLoad] = useState(true);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [loadedVisitsCount, setLoadedVisitsCount] = useState(0);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  // Dr. Chrono OAuth configuration - should match the values in account-component.tsx
  const DR_CHRONO_CLIENT_ID = "3wlyTRtbshv4JaNgkSoRqEngrjquyy2Foptd26ek";
  const DR_CHRONO_CLIENT_SECRET = "f17KuCmvO9Wuw4zaIB4MAUHtSEckVFBrsKav0Ua2bbG5m4bqQb3W8pECQjBnHmBZGebwhTecJSkvSLeS7HXtbh8Pqf4Hf0XLSFJ7ZWVxRTbmnXCJv98pDChxNgbLBZX4";
  const DR_CHRONO_REDIRECT_URI = "http://localhost:3000/dashboard";

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000);

      // Clean up the URL
      window.history.replaceState({}, document.title, "/dashboard");
    }

    // Handle Dr. Chrono OAuth callback
    const handleDrChronoCallback = async () => {
      const code = searchParams.get("code");
      const screenParam = searchParams.get("screen");
      const emrParam = searchParams.get("emr");

      if (code && emrParam === "DR_CHRONO" && session && !isProcessingOAuth) {
        setIsProcessingOAuth(true);
        try {
          // Exchange code for tokens
          const tokenResponse = await exchangeDrChronoCode(
            code,
            DR_CHRONO_CLIENT_ID,
            DR_CHRONO_CLIENT_SECRET,
            DR_CHRONO_REDIRECT_URI + "?screen=ACCOUNT&emr=DR_CHRONO"
          );

          // Calculate expiration date
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

          // Store tokens in backend
          const credentials = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: expiresAt.toISOString()
          };

          const updatedUser = await apiVerifyEMRIntegration(session.session_id, "DR_CHRONO", credentials);
          dispatch(setUser(updatedUser));

          // Navigate to the specified screen
          if (screenParam === "ACCOUNT") {
            dispatch(setScreen("ACCOUNT"));
          }

          // Clean up URL
          window.history.replaceState({}, document.title, "/dashboard");
        } catch (error) {
          console.error("Dr. Chrono OAuth error:", error);
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };

    handleDrChronoCallback();
  }, [searchParams, session, isProcessingOAuth]);

  const loadMoreVisits = async () => {
    if (!session || hasLoadedAll) return;

    try {
      const moreVisits = await apiGetUserVisits(session.session_id, false, loadedVisitsCount, 20);

      if (moreVisits.length < 20) {
        setHasLoadedAll(true);
      }

      if (moreVisits.length > 0) {
        const existingVisitIds = new Set(visits.map((v) => v.visit_id));
        const newVisits = moreVisits.filter((v) => !existingVisitIds.has(v.visit_id));
        dispatch(setVisits([...visits, ...newVisits]));
        setLoadedVisitsCount(loadedVisitsCount + newVisits.length);
      }
    } catch (error) {
      console.error("Failed to load more visits:", error);
    }
  };

  useEffect(() => {
    const createVisitHandler = handle("create_visit", "dashboard", (data) => {
      console.log("Processing create_visit in dashboard");
      dispatch(setVisits([...visits, data.data]));

      if (data.was_requested) {
        dispatch(setSelectedVisit(data.data));
        dispatch(setScreen("RECORD"));
      }
    });

    const updateVisitHandler = handle("update_visit", "dashboard", (data) => {
      console.log("Processing update_visit in dashboard");

      if (data.was_requested && ("name" in data.data || "note" in data.data || "additional_context" in data.data) && "modified_at" in data.data) {
        dispatch(setVisit({ visit_id: data.data.visit_id, modified_at: data.data.modified_at }));
        return;
      }

      dispatch(setVisit(data.data));
    });

    const deleteVisitHandler = handle("delete_visit", "dashboard", (data) => {
      console.log("Processing delete_visit in dashboard");
      dispatch(setVisits(visits.filter((visit) => visit.visit_id !== data.data.visit_id)));

      if (selectedVisit?.visit_id === data.data.visit_id) {
        dispatch(clearSelectedVisit());
        dispatch(setScreen("ACCOUNT"));
      }
    });

    const startRecordingHandler = handle("start_recording", "dashboard", (data) => {
      console.log("Processing start_recording in dashboard");
      dispatch(setVisit(data.data));

      if (!data.was_requested) {
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "dashboard", (data) => {
      console.log("Processing pause_recording in dashboard");
      dispatch(setVisit(data.data));
    });

    const resumeRecordingHandler = handle("resume_recording", "dashboard", (data) => {
      console.log("Processing resume_recording in dashboard");
      dispatch(setVisit(data.data));

      if (!data.was_requested) {
        if (selectedVisit?.visit_id == data.data.visit_id) {
          dispatch(clearSelectedVisit());
          dispatch(setScreen("ACCOUNT"));
        }
      }
    });

    const finishRecordingHandler = handle("finish_recording", "dashboard", (data) => {
      console.log("Processing finish_recording in dashboard");
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
      console.log("Processing create_template in dashboard");
      dispatch(setTemplates([...templates, data.data]));

      if (data.was_requested) {
        dispatch(setSelectedTemplate(data.data as Template));
        dispatch(setScreen("TEMPLATE"));
      }
    });

    const updateTemplateHandler = handle("update_template", "dashboard", (data) => {
      console.log("Processing update_template in dashboard");

      if (data.was_requested && ("name" in data.data || "instructions" in data.data) && "modified_at" in data.data) {
        dispatch(setTemplate({ template_id: data.data.template_id, modified_at: data.data.modified_at }));
        return;
      }

      dispatch(setTemplate(data.data));
    });

    const deleteTemplateHandler = handle("delete_template", "dashboard", (data) => {
      console.log("Processing delete_template in dashboard");
      dispatch(setTemplates(templates.filter((template) => template.template_id !== data.data.template_id)));

      if (screen === "TEMPLATE") {
        if (selectedTemplate?.template_id === data.data.template_id) {
          dispatch(clearSelectedTemplate());
          dispatch(setScreen("TEMPLATES"));
        }
      }
    });

    const duplicateTemplateHandler = handle("duplicate_template", "dashboard", (data) => {
      console.log("Processing duplicate_template in dashboard");
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
      console.log("Processing update_user in dashboard");
      dispatch(setUser(data.data));
    });

    return () => {
      updateUserHandler();
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
      apiGetUser(session.session_id).then(async (user) => {
        dispatch(setUser(user));

        if (user.status === "UNVERIFIED") {
          window.location.href = `/verify-email?session_id=${session.session_id}`;
          return;
        }

        // Check subscription status
        const subscriptionResponse = await apiCheckSubscription(user.user_id!);
        const { has_active_subscription } = subscriptionResponse;
        if (!has_active_subscription && user.subscription?.plan !== "CUSTOM") {
          window.location.href = "/payment-required";
          return;
        }
      }),
      apiGetUserTemplates(session.session_id).then((templates) => {
        dispatch(setTemplates(templates));
      }),
      apiGetUserVisits(session.session_id, true).then((visits) => {
        dispatch(setVisits(visits));
        setLoadedVisitsCount(visits.length);
        const lastNonRecordingVisit = [...visits].find((visit) => visit.status !== "RECORDING");
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

  return (
    <>
      {(initialLoad || isProcessingOAuth) && (
        <div className="fixed inset-0 bg-background/10 backdrop-blur-[4px] z-40 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            {isProcessingOAuth && <p className="text-sm text-muted-foreground">Connecting to Dr. Chrono...</p>}
          </div>
        </div>
      )}

      {showPaymentSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-green-800">✓ Payment successful! Welcome to your dashboard.</p>
        </div>
      )}

      <Application>
        <SidebarComponent loadMoreVisits={loadMoreVisits} hasLoadedAll={hasLoadedAll} />
        {screen === "ACCOUNT" && <AccountComponent />}
        {screen === "NOTE" && <NoteComponent />}
        {screen === "RECORD" && <RecordComponent />}
        {screen === "TEMPLATE" && <TemplateComponent />}
        {screen === "TEMPLATES" && <TemplatesComponent />}
        {!isMobile && <AskAIComponent />}
      </Application>
    </>
  );
}
