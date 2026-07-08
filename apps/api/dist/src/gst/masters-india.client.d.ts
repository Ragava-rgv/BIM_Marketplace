import { ConfigService } from '@nestjs/config';
export interface GstVerifyResult {
    gstin: string;
    status: string;
    legalName: string | null;
    tradeName: string | null;
}
export declare class GstVerifyClient {
    private readonly config;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: ConfigService);
    lookupGstin(gstNumber: string): Promise<GstVerifyResult | null>;
    private stubbedLookup;
}
