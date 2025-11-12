import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface TextareaFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function TextareaField({ field, register, errors }: TextareaFieldProps) {
  const error = errors[field.id]?.message as string;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <textarea
        id={field.id}
        placeholder={field.placeholder}
        rows={4}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

