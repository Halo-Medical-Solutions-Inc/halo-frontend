import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Visit } from "../types";

export interface VisitState {
  visits: Visit[];
  selectedVisit: Visit | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisitState = {
  visits: [],
  selectedVisit: null,
  loading: false,
  error: null,
};

const visitSlice = createSlice({
  name: "visit",
  initialState,
  reducers: {
    setVisit: (state: VisitState, action: PayloadAction<Visit>) => {
      const updatedVisit = action.payload;
      const index = state.visits.findIndex((visit) => visit.visit_id === updatedVisit.visit_id);
      if (index !== -1) {
        state.visits[index] = { ...state.visits[index], ...updatedVisit };
        if (state.selectedVisit && state.selectedVisit.visit_id === updatedVisit.visit_id) {
          state.selectedVisit = { ...state.selectedVisit, ...updatedVisit };
        }
      }
    },
    setSelectedVisit: (state: VisitState, action: PayloadAction<Visit>) => {
      state.selectedVisit = action.payload;
      const index = state.visits.findIndex((visit) => visit.visit_id === action.payload.visit_id);
      if (index !== -1) {
        state.visits[index] = { ...state.visits[index], ...action.payload };
      }
    },
    clearSelectedVisit: (state: VisitState) => {
      state.selectedVisit = null;
    },
    setVisits: (state: VisitState, action: PayloadAction<Visit[]>) => {
      state.visits = action.payload;
    },
    clearVisits: (state: VisitState) => {
      state.visits = [];
    },
    setLoading: (state: VisitState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: VisitState, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setVisit, setSelectedVisit, clearSelectedVisit, setVisits, clearVisits, setLoading, setError } = visitSlice.actions;
export default visitSlice.reducer;
