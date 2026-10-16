import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyGstDto {
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'gstNumber must be a valid 15-character GSTIN',
  })
  gstNumber: string;

  /** Required for sellers only (enforced in GstService.verify) — buyers never send this. */
  @IsOptional()
  @IsString()
  @Length(10, 300)
  address?: string;
}
