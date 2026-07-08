import { MediaType } from '@prisma/client';
export declare class UploadMediaDto {
    type: MediaType;
    capturedAt?: string;
    durationSeconds?: number;
}
