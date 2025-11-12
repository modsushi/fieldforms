import { FormField } from '@fieldform/types';
import { Input, Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface NumberFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function NumberField({ field, register, errors }: NumberFieldProps) {
  const error = errors[field.id]?.message as string;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="number"
        placeholder={field.placeholder}
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
          valueAsNumber: true,
        })}
        aria-invalid={error ? 'true' : 'false'}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

