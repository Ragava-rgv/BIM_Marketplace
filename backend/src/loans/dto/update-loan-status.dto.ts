import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class UpdateLoanStatusDto {
  @IsIn(['CERT_PENDING', 'WITH_PARTNER', 'APPROVED', 'REJECTED'])
  status: 'CERT_PENDING' | 'WITH_PARTNER' | 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsUUID()
  partnerId?: string;
}
