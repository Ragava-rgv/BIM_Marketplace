import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * Prefixed inspection template the certifying inspector fills in
 * (project_spec.md certification flow) — stored as JSON on Certification.inspectionReport.
 */
export class InspectionReportDto {
  @IsIn(['A', 'B', 'C', 'D'])
  conditionGrade: 'A' | 'B' | 'C' | 'D';

  @IsInt()
  @Min(0)
  verifiedRunHours: number;

  @IsInt()
  @Min(1900)
  verifiedManufactureYear: number;

  @IsBoolean()
  functionalTestPassed: boolean;

  @IsString()
  @MaxLength(2000)
  defectsObserved: string;

  @IsNumber()
  @Min(0)
  recommendedMarketValue: number;

  @IsString()
  @MaxLength(120)
  inspectorName: string;

  @IsDateString()
  inspectionDate: string;
}
