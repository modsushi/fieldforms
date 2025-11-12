import { create } from 'zustand';
import { FormTemplate, FormSection, FormField } from '@fieldform/types';

interface FormBuilderState {
  // Current form being edited
  currentForm: Partial<FormTemplate> | null;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  
  // Actions
  setCurrentForm: (form: Partial<FormTemplate> | null) => void;
  updateFormMetadata: (metadata: Partial<FormTemplate>) => void;
  
  // Section management
  addSection: (section: FormSection) => void;
  updateSection: (sectionId: string, updates: Partial<FormSection>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (sectionId: string | null) => void;
  
  // Field management
  addField: (sectionId: string, field: FormField) => void;
  updateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  reorderFields: (sectionId: string, fromIndex: number, toIndex: number) => void;
  selectField: (fieldId: string | null) => void;
  
  // Utility
  reset: () => void;
}

const initialState = {
  currentForm: null,
  selectedFieldId: null,
  selectedSectionId: null,
};

export const useFormBuilder = create<FormBuilderState>((set, get) => ({
  ...initialState,

  setCurrentForm: (form) => set({ currentForm: form, selectedFieldId: null, selectedSectionId: null }),

  updateFormMetadata: (metadata) => set((state) => ({
    currentForm: state.currentForm ? { ...state.currentForm, ...metadata } : null,
  })),

  // Section management
  addSection: (section) => set((state) => {
    if (!state.currentForm) return state;
    const sections = state.currentForm.sections || [];
    return {
      currentForm: {
        ...state.currentForm,
        sections: [...sections, section],
      },
    };
  }),

  updateSection: (sectionId, updates) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.map((section) =>
          section.id === sectionId ? { ...section, ...updates } : section
        ),
      },
    };
  }),

  removeSection: (sectionId) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.filter((s) => s.id !== sectionId),
      },
      selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
    };
  }),

  reorderSections: (fromIndex, toIndex) => set((state) => {
    if (!state.currentForm?.sections) return state;
    const sections = [...state.currentForm.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    return {
      currentForm: {
        ...state.currentForm,
        sections,
      },
    };
  }),

  selectSection: (sectionId) => set({ selectedSectionId: sectionId, selectedFieldId: null }),

  // Field management
  addField: (sectionId, field) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.map((section) =>
          section.id === sectionId
            ? { ...section, fields: [...section.fields, field] }
            : section
        ),
      },
    };
  }),

  updateField: (sectionId, fieldId, updates) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.map((field) =>
                  field.id === fieldId ? { ...field, ...updates } : field
                ),
              }
            : section
        ),
      },
    };
  }),

  removeField: (sectionId, fieldId) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.map((section) =>
          section.id === sectionId
            ? { ...section, fields: section.fields.filter((f) => f.id !== fieldId) }
            : section
        ),
      },
      selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
    };
  }),

  reorderFields: (sectionId, fromIndex, toIndex) => set((state) => {
    if (!state.currentForm?.sections) return state;
    return {
      currentForm: {
        ...state.currentForm,
        sections: state.currentForm.sections.map((section) => {
          if (section.id === sectionId) {
            const fields = [...section.fields];
            const [moved] = fields.splice(fromIndex, 1);
            fields.splice(toIndex, 0, moved);
            return { ...section, fields };
          }
          return section;
        }),
      },
    };
  }),

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  reset: () => set(initialState),
}));

