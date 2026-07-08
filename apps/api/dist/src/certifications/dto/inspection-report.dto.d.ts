export declare class InspectionReportDto {
    conditionGrade: 'A' | 'B' | 'C' | 'D';
    verifiedRunHours: number;
    verifiedManufactureYear: number;
    functionalTestPassed: boolean;
    defectsObserved: string;
    recommendedMarketValue: number;
    inspectorName: string;
    inspectionDate: string;
}
