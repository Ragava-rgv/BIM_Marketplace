import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GstVerifyClient } from './masters-india.client';
export declare class GstService {
    private readonly prisma;
    private readonly mastersIndia;
    constructor(prisma: PrismaService, mastersIndia: GstVerifyClient);
    verify(userId: string, gstNumber: string): Promise<User>;
    private markStatus;
}
