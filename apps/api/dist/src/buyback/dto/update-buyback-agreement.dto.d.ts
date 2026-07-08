export declare class BuybackScheduleEntryInputDto {
    yearOffset: number;
    retainedValuePct: number;
    buybackValue: number;
}
export declare class UpdateBuybackAgreementDto {
    buybackWindowYears?: number;
    noticePeriodDays?: number;
    conditions?: string;
    depreciationSchedule?: BuybackScheduleEntryInputDto[];
}
