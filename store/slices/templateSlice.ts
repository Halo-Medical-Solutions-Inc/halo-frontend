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
    setTemplate: (state: TemplateState, action: PayloadAction<Template>) => {
      const updatedTemplate = action.payload;
      const index = state.templates.findIndex((template) => template.template_id === updatedTemplate.template_id);
      if (index !== -1) {
        state.templates[index] = { ...state.templates[index], ...updatedTemplate };
        if (state.selectedTemplate && state.selectedTemplate.template_id === updatedTemplate.template_id) {
          state.selectedTemplate = { ...state.selectedTemplate, ...updatedTemplate };
        }
      }
    },
    setSelectedTemplate: (state: TemplateState, action: PayloadAction<Template>) => {
      state.selectedTemplate = action.payload;
      const index = state.templates.findIndex((template) => template.template_id === action.payload.template_id);
      if (index !== -1) {
        state.templates[index] = { ...state.templates[index], ...action.payload };
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
