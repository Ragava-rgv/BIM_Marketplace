import { PrismaService } from '../prisma/prisma.service';
export interface NotifyInput {
    type: string;
    title: string;
    body?: string;
    relatedId?: string;
}
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    notify(userId: string, input: NotifyInput): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string | null;
        relatedId: string | null;
        isRead: boolean;
    }>;
    findMine(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string | null;
        relatedId: string | null;
        isRead: boolean;
    }[]>;
    unreadCount(userId: string): Promise<number>;
    markRead(userId: string, id: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
}
