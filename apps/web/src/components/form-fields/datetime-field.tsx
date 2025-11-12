import { FormField } from '@fieldform/types';
import { Input, Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface DatetimeFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function DatetimeField({ field, register, errors }: DatetimeFieldProps) {
  const error = errors[field.id]?.message as string;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="datetime-local"
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
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

