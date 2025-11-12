'use client';

import { useEffect } from 'react';
import type { FormField } from '@fieldform/types';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { EntityCreatorField } from './entity-creator-field';
import type { EntityCreationData } from '@/lib/forms/entity-extraction';

interface EntityCreatorControlledProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export function EntityCreatorControlled({
  field,
  register,
  errors,
  watch,
  setValue,
}: EntityCreatorControlledProps) {
  // Register the field with react-hook-form
  useEffect(() => {
    register(field.id, {
      required: field.required ? `${field.label} is required` : false,
    });
  }, [field.id, field.label, field.required, register]);

  // Watch the current value
  const value = watch(field.id);

  const handleChange = (data: EntityCreationData | null) => {
    setValue(field.id, data, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const error = errors[field.id]?.message as string | undefined;

  return (
    <EntityCreatorField
      field={field}
      value={value}
      onChange={handleChange}
      error={error}
    />
  );
}

