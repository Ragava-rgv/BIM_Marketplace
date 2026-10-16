import { IsIn } from 'class-validator';

export class UpdateEnquiryDto {
  @IsIn(['CLOSED'])
  status: 'CLOSED';
}
