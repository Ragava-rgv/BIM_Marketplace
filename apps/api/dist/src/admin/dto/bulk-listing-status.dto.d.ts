export type BulkListingStatusAction = 'approve' | 'reject' | 'mark-sold' | 'mark-inactive' | 'reactivate';
export declare class BulkListingStatusDto {
    ids: string[];
    action: BulkListingStatusAction;
}
