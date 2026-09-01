import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

/** Requirement media is illustrative only (no strict listing-style photo/timestamp gate —
    a "wanted" post doesn't need proof-of-condition media the way a for-sale listing does). */
export class UploadRequirementMediaDto {
  @IsIn(['PHOTO', 'VIDEO'])
  type: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
