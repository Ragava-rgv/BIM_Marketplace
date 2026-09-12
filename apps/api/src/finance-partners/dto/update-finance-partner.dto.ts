import { PartialType } from '@nestjs/mapped-types';
import { CreateFinancePartnerDto } from './create-finance-partner.dto';

export class UpdateFinancePartnerDto extends PartialType(
  CreateFinancePartnerDto,
) {}
