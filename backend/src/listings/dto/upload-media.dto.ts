import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsISO8601, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadMediaDto {
  @IsIn(['PHOTO', 'VIDEO'])
  type: MediaType;

  /** Required for photos — when the timestamp overlay/EXIF says the shot was captured. */
  @IsOptional()
  @IsISO8601()
  capturedAt?: string;

  /** Required for the running-machine video. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
