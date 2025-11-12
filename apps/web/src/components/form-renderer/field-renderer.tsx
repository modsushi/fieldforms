import { FormField } from '@fieldform/types';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  CheckboxField,
  RadioField,
  DateField,
  DatetimeField,
  FileField,
  PhotoField,
  LocationField,
} from '../form-fields';
import { EntitySelectorControlled } from '../form-fields/entity-selector-controlled';
import { EntityCreatorControlled } from '../form-fields/entity-creator-controlled';

interface FieldRendererProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function FieldRenderer({ field, register, errors, watch, setValue }: FieldRendererProps) {
  // TODO: Implement conditional visibility logic here
  // For now, all fields are visible

  switch (field.type) {
    case 'text':
      return <TextField field={field} register={register} errors={errors} />;

    case 'number':
      return <NumberField field={field} register={register} errors={errors} />;

    case 'textarea':
      return <TextareaField field={field} register={register} errors={errors} />;

    case 'select':
      return <SelectField field={field} register={register} errors={errors} />;

    case 'checkbox':
      return <CheckboxField field={field} register={register} errors={errors} />;

    case 'radio':
      return <RadioField field={field} register={register} errors={errors} />;

    case 'date':
      return <DateField field={field} register={register} errors={errors} />;

    case 'datetime':
      return <DatetimeField field={field} register={register} errors={errors} />;

    case 'file':
      return <FileField field={field} register={register} errors={errors} />;

    case 'photo':
      return <PhotoField field={field} register={register} errors={errors} />;

    case 'location':
      return <LocationField field={field} register={register} errors={errors} />;

    case 'entity_selector':
      return <EntitySelectorControlled field={field} register={register} errors={errors} watch={watch} setValue={setValue} />;

    case 'entity_creator':
      return <EntityCreatorControlled field={field} register={register} errors={errors} watch={watch} setValue={setValue} />;

    // Placeholder for signature (more complex)
    case 'signature':
      return (
        <div className="p-4 border-2 border-dashed rounded-md text-center text-muted-foreground">
          {field.label} (Signature) - Coming soon
        </div>
      );

    default:
      return (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          Unknown field type: {field.type}
        </div>
      );
  }
}

