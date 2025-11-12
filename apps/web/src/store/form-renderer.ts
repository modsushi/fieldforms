import { create } from 'zustand';

interface FormRendererState {
  // Form data
  formData: Record<string, any>;
  errors: Record<string, string>;
  
  // Field visibility (for conditional logic)
  visibleFields: Set<string>;
  
  // Actions
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldError: (fieldId: string, error: string | null) => void;
  setFieldVisibility: (fieldId: string, visible: boolean) => void;
  clearForm: () => void;
  setFormData: (data: Record<string, any>) => void;
}

export const useFormRenderer = create<FormRendererState>((set) => ({
  formData: {},
  errors: {},
  visibleFields: new Set(),

  setFieldValue: (fieldId, value) => set((state) => ({
    formData: { ...state.formData, [fieldId]: value },
  })),

  setFieldError: (fieldId, error) => set((state) => {
    if (error === null) {
      const { [fieldId]: _, ...rest } = state.errors;
      return { errors: rest };
    }
    return {
      errors: { ...state.errors, [fieldId]: error },
    };
  }),

  setFieldVisibility: (fieldId, visible) => set((state) => {
    const newVisibleFields = new Set(state.visibleFields);
    if (visible) {
      newVisibleFields.add(fieldId);
    } else {
      newVisibleFields.delete(fieldId);
    }
    return { visibleFields: newVisibleFields };
  }),

  clearForm: () => set({ formData: {}, errors: {}, visibleFields: new Set() }),

  setFormData: (data) => set({ formData: data }),
}));

