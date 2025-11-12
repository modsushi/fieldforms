import { FormField } from '@fieldform/types';

export interface FieldTypeConfig {
  type: FormField['type'];
  label: string;
  icon: string;
  description: string;
  defaultConfig: Partial<FormField>;
}

export const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: '📝',
    description: 'Single line text input',
    defaultConfig: {
      type: 'text',
      label: 'Text Field',
      required: false,
      placeholder: 'Enter text...',
    },
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: '📄',
    description: 'Multi-line text input',
    defaultConfig: {
      type: 'textarea',
      label: 'Text Area',
      required: false,
      placeholder: 'Enter details...',
    },
  },
  {
    type: 'number',
    label: 'Number',
    icon: '🔢',
    description: 'Numeric input',
    defaultConfig: {
      type: 'number',
      label: 'Number Field',
      required: false,
    },
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: '▼',
    description: 'Select from options',
    defaultConfig: {
      type: 'select',
      label: 'Select Field',
      required: false,
      options: {
        source: 'static',
        value: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ],
      },
    },
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: '⚪',
    description: 'Choose one option',
    defaultConfig: {
      type: 'radio',
      label: 'Radio Field',
      required: false,
      options: {
        source: 'static',
        value: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ],
      },
    },
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑️',
    description: 'Yes/no toggle',
    defaultConfig: {
      type: 'checkbox',
      label: 'Checkbox Field',
      required: false,
    },
  },
  {
    type: 'date',
    label: 'Date',
    icon: '📅',
    description: 'Date picker',
    defaultConfig: {
      type: 'date',
      label: 'Date Field',
      required: false,
    },
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    icon: '🕐',
    description: 'Date and time picker',
    defaultConfig: {
      type: 'datetime',
      label: 'DateTime Field',
      required: false,
    },
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: '📎',
    description: 'Upload any file',
    defaultConfig: {
      type: 'file',
      label: 'File Field',
      required: false,
    },
  },
  {
    type: 'photo',
    label: 'Photo Capture',
    icon: '📸',
    description: 'Take or upload photo',
    defaultConfig: {
      type: 'photo',
      label: 'Photo Field',
      required: false,
    },
  },
  {
    type: 'location',
    label: 'Location',
    icon: '📍',
    description: 'Capture GPS location',
    defaultConfig: {
      type: 'location',
      label: 'Location Field',
      required: false,
    },
  },
];

