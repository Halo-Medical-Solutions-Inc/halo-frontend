import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Template } from "../types";

export interface TemplateState {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
}

const initialState: TemplateState = {
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
};

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    setTemplate: (state: TemplateState, action: PayloadAction<string>) => {
      const templateId = action.payload;
      const template = state.templates.find((template) => template._id === templateId);
      if (template) {
        state.selectedTemplate = template;
      }
    },
    setSelectedTemplate: (state: TemplateState, action: PayloadAction<Template>) => {
      state.selectedTemplate = action.payload;
      const index = state.templates.findIndex((template) => template._id === action.payload._id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
    },
    clearSelectedTemplate: (state: TemplateState) => {
      state.selectedTemplate = null;
    },
    setTemplates: (state: TemplateState, action: PayloadAction<Template[]>) => {
      state.templates = action.payload;
    },
    clearTemplates: (state: TemplateState) => {
      state.templates = [];
    },
    setLoading: (state: TemplateState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: TemplateState, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setTemplate, setSelectedTemplate, clearSelectedTemplate, setTemplates, clearTemplates, setLoading, setError } = templateSlice.actions;
export default templateSlice.reducer;
