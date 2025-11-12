import { ConditionalRule, Condition } from '@fieldform/types';

/**
 * Evaluates a single condition against form data
 */
export function evaluateCondition(
  condition: Condition,
  formData: Record<string, any>
): boolean {
  const fieldValue = formData[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue;

    case 'not_equals':
      return fieldValue !== compareValue;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(compareValue));
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;

    case 'not_contains':
      if (typeof fieldValue === 'string') {
        return !fieldValue.includes(String(compareValue));
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue);
      }
      return true;

    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);

    case 'less_than':
      return Number(fieldValue) < Number(compareValue);

    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue);
      }
      return false;

    case 'not_in':
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue);
      }
      return true;

    case 'regex':
      if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
        try {
          const regex = new RegExp(compareValue);
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluates a conditional rule against form data
 * Returns true if the condition is met, false otherwise
 */
export function evaluateConditionalRule(
  rule: ConditionalRule | boolean | undefined,
  formData: Record<string, any>
): boolean {
  // If rule is undefined, default to true (visible/enabled by default)
  if (rule === undefined) {
    return true;
  }

  // If rule is a boolean, return it directly
  if (typeof rule === 'boolean') {
    return rule;
  }

  // Handle expression type (simple string evaluation)
  if (rule.type === 'expression' && typeof rule.value === 'string') {
    try {
      // Simple expression evaluation - can be enhanced later
      // For now, just check if the field has a truthy value
      const fieldName = rule.value;
      return Boolean(formData[fieldName]);
    } catch (error) {
      console.error('Error evaluating expression:', error);
      return false;
    }
  }

  // Handle rule type with conditions
  if (rule.type === 'rule' && typeof rule.value === 'object' && 'conditions' in rule.value) {
    const { conditions } = rule.value;

    // Evaluate 'all' conditions (AND logic)
    if (conditions.all && conditions.all.length > 0) {
      const allMatch = conditions.all.every((condition) =>
        evaluateCondition(condition, formData)
      );
      if (!allMatch) {
        return false;
      }
    }

    // Evaluate 'any' conditions (OR logic)
    if (conditions.any && conditions.any.length > 0) {
      const anyMatch = conditions.any.some((condition) =>
        evaluateCondition(condition, formData)
      );
      if (!anyMatch) {
        return false;
      }
    }

    // Evaluate 'not' condition (NOT logic)
    if (conditions.not) {
      const notMatch = !evaluateCondition(conditions.not, formData);
      if (!notMatch) {
        return false;
      }
    }

    // If we got here, all conditions passed
    return true;
  }

  // Default to true if we can't evaluate
  return true;
}

/**
 * Check if a field should be visible based on its conditional rules
 */
export function isFieldVisible(
  field: any,
  formData: Record<string, any>
): boolean {
  if (!field.visible) {
    return true; // No visibility rule means always visible
  }

  return evaluateConditionalRule(field.visible, formData);
}

/**
 * Check if a field should be disabled based on its conditional rules
 */
export function isFieldDisabled(
  field: any,
  formData: Record<string, any>
): boolean {
  if (!field.disabled) {
    return false; // No disabled rule means never disabled
  }

  return evaluateConditionalRule(field.disabled, formData);
}

/**
 * Check if a field is required based on its conditional rules
 */
export function isFieldRequired(
  field: any,
  formData: Record<string, any>
): boolean {
  if (typeof field.required === 'boolean') {
    return field.required;
  }

  if (field.required && typeof field.required === 'object') {
    return evaluateConditionalRule(field.required, formData);
  }

  return false; // Default to not required
}

/**
 * Check if a section should be visible based on its conditional rules
 */
export function isSectionVisible(
  section: any,
  formData: Record<string, any>
): boolean {
  if (!section.visible) {
    return true; // No visibility rule means always visible
  }

  return evaluateConditionalRule(section.visible, formData);
}

/**
 * Get all fields that should be visible in the current form state
 */
export function getVisibleFields(
  sections: any[],
  formData: Record<string, any>
): string[] {
  const visibleFields: string[] = [];

  for (const section of sections) {
    if (!isSectionVisible(section, formData)) {
      continue; // Skip hidden sections
    }

    for (const field of section.fields || []) {
      if (isFieldVisible(field, formData)) {
        visibleFields.push(field.id);
      }
    }
  }

  return visibleFields;
}

