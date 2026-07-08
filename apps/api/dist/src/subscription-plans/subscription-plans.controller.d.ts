import { SubscriptionPlansService } from './subscription-plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export declare class SubscriptionPlansController {
    private readonly service;
    constructor(service: SubscriptionPlansService);
    listActive(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        listingQuota: number;
        priceInr: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        isActive: boolean;
        isFree: boolean;
        description: string | null;
        sortOrder: number;
    }[]>;
    listAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        listingQuota: number;
        priceInr: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        isActive: boolean;
        isFree: boolean;
        description: string | null;
        sortOrder: number;
    }[]>;
    create(dto: CreatePlanDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        listingQuota: number;
        priceInr: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        isActive: boolean;
        isFree: boolean;
        description: string | null;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdatePlanDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        listingQuota: number;
        priceInr: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        isActive: boolean;
        isFree: boolean;
        description: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        listingQuota: number;
        priceInr: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        isActive: boolean;
        isFree: boolean;
        description: string | null;
        sortOrder: number;
    }>;
}
