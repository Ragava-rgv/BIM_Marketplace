import { InspectionReportDto } from './inspection-report.dto';
export declare class UpdateCertificationDto {
    status?: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    inspectorNotes?: string;
    inspectionReport?: InspectionReportDto;
}
