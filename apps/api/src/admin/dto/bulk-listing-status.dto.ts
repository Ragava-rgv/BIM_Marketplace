import { ArrayMinSize, IsArray, IsIn, IsUUID } from 'class-validator';

export type BulkListingStatusAction = 'approve' | 'reject' | 'mark-sold' | 'mark-inactive' | 'reactivate';

const ACTIONS: BulkListingStatusAction[] = ['approve', 'reject', 'mark-sold', 'mark-inactive', 'reactivate'];

export class BulkListingStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];

  @IsIn(ACTIONS)
  action: BulkListingStatusAction;
}
