import { Matches } from 'class-validator';

export class VerifyGstDto {
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'gstNumber must be a valid 15-character GSTIN',
  })
  gstNumber: string;
}
