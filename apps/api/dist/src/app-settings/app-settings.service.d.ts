import { PrismaService } from '../prisma/prisma.service';
export declare class AppSettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        updatedAt: Date;
        key: string;
        value: string;
        label: string;
    }[]>;
    get(key: string): Promise<string>;
    update(key: string, value: string): Promise<{
        updatedAt: Date;
        key: string;
        value: string;
        label: string;
    }>;
}
