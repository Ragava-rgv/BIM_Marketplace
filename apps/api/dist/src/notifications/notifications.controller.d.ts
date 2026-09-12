import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    findMine(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string | null;
        relatedId: string | null;
        isRead: boolean;
    }[]>;
    unreadCount(user: AuthenticatedUser): Promise<{
        count: number;
    }>;
    markRead(user: AuthenticatedUser, id: string): Promise<{
        read: boolean;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        read: boolean;
    }>;
}
