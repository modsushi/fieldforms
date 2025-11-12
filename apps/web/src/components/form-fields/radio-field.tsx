import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface RadioFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function RadioField({ field, register, errors }: RadioFieldProps) {
  const error = errors[field.id]?.message as string;
  
  // Get options from field config
  const options = field.options?.source === 'static' 
    ? (field.options.value as Array<{ label: string; value: string }>)
    : [];

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${field.id}-${option.value}`}
              value={option.value}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              {...register(field.id, {
                required: field.required ? `${field.label} is required` : false,
              })}
            />
            <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

