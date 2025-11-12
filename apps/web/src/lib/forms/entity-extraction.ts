/**
 * Utility functions for extracting and validating entity creation data from form submissions
 */

import type { FormField } from '@fieldform/types';
import { coordinatesToWKT } from '@/lib/geo/geometry-utils';

export interface EntityCreationData {
  name: string;
  geometry?: string; // WKT format
  metadata?: Record<string, any>;
}

export interface EntityToCreate {
  fieldId: string;
  entityType: string;
  name: string;
  geometry?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Build a minimal entity from basic data
 */
export function buildMinimalEntity(
  name: string,
  location: { lat: number; lng: number } | null,
  entityType: string
): EntityCreationData {
  return {
    name,
    geometry: location ? coordinatesToWKT(location) : undefined,
    metadata: {},
  };
}

/**
 * Extract entity data from form data based on mapped fields configuration
 */
export function extractEntityDataFromForm(
  formData: Record<string, any>,
  fieldConfig: FormField
): EntityCreationData | null {
  const options = fieldConfig.options?.value;
  
  if (!options) return null;

  const mode = options.mode || 'minimal';

  if (mode === 'minimal') {
    // In minimal mode, the field value should already be EntityCreationData
    const fieldValue = formData[fieldConfig.id];
    if (!fieldValue || !fieldValue.name) return null;
    
    return {
      name: fieldValue.name,
      geometry: fieldValue.geometry,
      metadata: fieldValue.metadata || {},
    };
  } else if (mode === 'mapped') {
    // In mapped mode, we need to extract data from other form fields
    const mappedFields = options.mappedFields || {};
    const entityData: EntityCreationData = {
      name: '',
      metadata: {},
    };

    // Extract mapped fields
    for (const [formFieldId, entityProp] of Object.entries(mappedFields)) {
      const value = formData[formFieldId];
      
      if (entityProp === '__name__') {
        entityData.name = String(value || '');
      } else if (entityProp === '__geometry__') {
        entityData.geometry = value;
      } else if (entityProp === '__code__') {
        // Code will be handled separately in metadata
        entityData.metadata!.code = value;
      } else {
        // Regular metadata field
        entityData.metadata![entityProp as string] = value;
      }
    }

    // Validate we have at least a name
    if (!entityData.name) return null;

    return entityData;
  }

  return null;
}

/**
 * Validate entity creation data before submission
 */
export function validateEntityData(data: EntityCreationData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Name is required
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Entity name is required');
  }

  // Name length check
  if (data.name && data.name.length > 255) {
    errors.push('Entity name must be 255 characters or less');
  }

  // Geometry validation (if provided)
  if (data.geometry) {
    // Basic WKT Point validation
    if (!data.geometry.match(/^POINT\s*\(\s*-?\d+\.?\d*\s+-?\d+\.?\d*\s*\)$/i)) {
      errors.push('Invalid geometry format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract all entity creation data from form submission
 */
export function extractEntitiesToCreate(
  formData: Record<string, any>,
  formFields: FormField[]
): EntityToCreate[] {
  const entityCreatorFields = formFields.filter(f => f.type === 'entity_creator');
  const entitiesToCreate: EntityToCreate[] = [];

  for (const field of entityCreatorFields) {
    const entityData = extractEntityDataFromForm(formData, field);
    
    if (entityData) {
      const validation = validateEntityData(entityData);
      
      if (validation.valid) {
        const options = field.options?.value;
        
        entitiesToCreate.push({
          fieldId: field.id,
          entityType: options?.entityType || 'site',
          name: entityData.name,
          geometry: entityData.geometry,
          metadata: entityData.metadata,
          tags: options?.autoTags || ['field-created'],
        });
      } else {
        console.error(`Entity validation failed for field ${field.id}:`, validation.errors);
      }
    }
  }

  return entitiesToCreate;
}

/**
 * Get all fields recursively from form sections
 */
export function getAllFieldsRecursive(sections: any[]): FormField[] {
  const fields: FormField[] = [];

  for (const section of sections) {
    if (section.fields) {
      fields.push(...section.fields);
    }
  }

  return fields;
}

