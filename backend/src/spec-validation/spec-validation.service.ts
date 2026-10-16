import { BadRequestException, Injectable } from '@nestjs/common';
import type { CategorySpecTemplate } from '@prisma/client';

export interface SpecValidationError {
  field: string;
  message: string;
}

@Injectable()
export class SpecValidationService {
  /**
   * Validates a submitted specs object against a category's spec template.
   * Returns the cleaned specs on success; throws BadRequestException with
   * field-level details on failure.
   */
  validate(
    template: CategorySpecTemplate[],
    submitted: Record<string, unknown>,
  ): Record<string, unknown> {
    const errors: SpecValidationError[] = [];
    const allowed = new Set(template.map((f) => f.fieldKey));

    // Unknown keys
    for (const key of Object.keys(submitted)) {
      if (!allowed.has(key)) {
        errors.push({ field: key, message: `Unknown spec field "${key}"` });
      }
    }

    for (const field of template) {
      const value = submitted[field.fieldKey];
      const missing = value === undefined || value === null || value === '';

      if (field.isRequired && missing) {
        errors.push({
          field: field.fieldKey,
          message: `${field.fieldLabel} is required`,
        });
        continue;
      }

      if (missing) continue;

      switch (field.fieldType) {
        case 'number': {
          const n = Number(value);
          if (Number.isNaN(n)) {
            errors.push({
              field: field.fieldKey,
              message: `${field.fieldLabel} must be a number`,
            });
          }
          break;
        }
        case 'select': {
          if (!field.options.includes(String(value))) {
            errors.push({
              field: field.fieldKey,
              message: `${field.fieldLabel} must be one of: ${field.options.join(', ')}`,
            });
          }
          break;
        }
        case 'boolean': {
          if (
            typeof value !== 'boolean' &&
            value !== 'true' &&
            value !== 'false'
          ) {
            errors.push({
              field: field.fieldKey,
              message: `${field.fieldLabel} must be true or false`,
            });
          }
          break;
        }
        case 'text':
          // any string is fine
          break;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Spec validation failed',
        errors,
      });
    }

    // Coerce numbers so we store clean values
    const cleaned: Record<string, unknown> = {};
    for (const field of template) {
      const value = submitted[field.fieldKey];
      if (value === undefined || value === null || value === '') continue;
      if (field.fieldType === 'number') {
        cleaned[field.fieldKey] = Number(value);
      } else if (field.fieldType === 'boolean') {
        cleaned[field.fieldKey] = value === true || value === 'true';
      } else {
        cleaned[field.fieldKey] = String(value);
      }
    }
    return cleaned;
  }
}
