import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SessionState {
  screen: "ACCOUNT" | "BILLING" | "NOTE" | "RECORD" | "TEMPLATE" | "TEMPLATES";
  session: any | null;
  isAuthenticated: boolean;
  patientList: Array<{ patient_id: string; patient_name: string; patient_details: string }> | null;
  isLoadingPatients: boolean;
}

const initialState: SessionState = {
  screen: "ACCOUNT",
  session: null,
  isAuthenticated: false,
  patientList: null,
  isLoadingPatients: false,
};

if (typeof window !== "undefined") {
  const savedSession = localStorage.getItem("session");
  if (savedSession) {
    try {
      initialState.session = JSON.parse(savedSession);
      initialState.isAuthenticated = true;
    } catch (e) {
      localStorage.removeItem("session");
    }
  }
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setScreen: (state: SessionState, action: PayloadAction<SessionState["screen"]>) => {
      state.screen = action.payload;
    },
    setSession: (state: SessionState, action: PayloadAction<any>) => {
      state.session = action.payload;
      state.isAuthenticated = true;
    },
    clearSession: (state: SessionState) => {
      state.session = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("session");
      }
    },
    setPatientList: (state: SessionState, action: PayloadAction<Array<{ patient_id: string; patient_name: string; patient_details: string }> | null>) => {
      state.patientList = action.payload;
    },
    setIsLoadingPatients: (state: SessionState, action: PayloadAction<boolean>) => {
      state.isLoadingPatients = action.payload;
    },
  },
});

export const { setSession, clearSession, setScreen, setPatientList, setIsLoadingPatients } = sessionSlice.actions;
export default sessionSlice.reducer;
