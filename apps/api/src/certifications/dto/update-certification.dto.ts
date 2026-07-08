import { IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionReportDto } from './inspection-report.dto';

export class UpdateCertificationDto {
  @IsOptional()
  @IsIn(['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'])
  status?: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  inspectorNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InspectionReportDto)
  inspectionReport?: InspectionReportDto;
}
