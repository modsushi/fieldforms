import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface SelectFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function SelectField({ field, register, errors }: SelectFieldProps) {
  const error = errors[field.id]?.message as string;
  
  // Get options from field config
  const options = field.options?.source === 'static' 
    ? (field.options.value as Array<{ label: string; value: string }>)
    : [];

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <select
        id={field.id}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
        })}
        aria-invalid={error ? 'true' : 'false'}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

