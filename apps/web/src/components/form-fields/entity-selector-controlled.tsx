'use client';

import { FormField } from '@fieldform/types';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { useEffect } from 'react';
import { EntitySelectorField } from './entity-selector-field';

interface EntitySelectorControlledProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

/**
 * Controlled wrapper for EntitySelectorField to work with react-hook-form
 */
export function EntitySelectorControlled({
  field,
  register,
  errors,
  watch,
  setValue,
}: EntitySelectorControlledProps) {
  const error = errors[field.id]?.message as string;
  const value = watch(field.id);

  // Register the field with react-hook-form
  useEffect(() => {
    register(field.id, {
      required: field.required ? `${field.label} is required` : false,
    });
  }, [field.id, field.label, field.required, register]);

  const handleChange = (entityId: string | null) => {
    setValue(field.id, entityId, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <EntitySelectorField
      field={field}
      value={value || null}
      onChange={handleChange}
      error={error}
    />
  );
}
