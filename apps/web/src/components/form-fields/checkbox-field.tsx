import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface CheckboxFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function CheckboxField({ field, register, errors }: CheckboxFieldProps) {
  const error = errors[field.id]?.message as string;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={field.id}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
          aria-invalid={error ? 'true' : 'false'}
        />
        <Label htmlFor={field.id} className="font-normal">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground ml-6">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive ml-6">{error}</p>
      )}
    </div>
  );
}

