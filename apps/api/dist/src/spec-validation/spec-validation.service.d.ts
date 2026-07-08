import type { CategorySpecTemplate } from '@prisma/client';
export interface SpecValidationError {
    field: string;
    message: string;
}
export declare class SpecValidationService {
    validate(template: CategorySpecTemplate[], submitted: Record<string, unknown>): Record<string, unknown>;
}
