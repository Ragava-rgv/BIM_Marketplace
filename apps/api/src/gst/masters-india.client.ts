import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GstVerifyResult {
  gstin: string;
  /** "Active" | "Cancelled" | "Suspended" | ... */
  status: string;
  legalName: string | null;
  tradeName: string | null;
}

/**
 * Thin client around the gstverify.co.in REST API.
 * Key is read from env (GST_VERIFY_API_KEY) and sent as X-API-Key header.
 * In development (key prefixed with "dev_"), calls are stubbed so the
 * 7-step verification flow can be exercised without spending credits.
 */
@Injectable()
export class GstVerifyClient {
  private readonly logger = new Logger(GstVerifyClient.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GST_VERIFY_API_KEY');
    this.baseUrl = this.config.get<string>('GST_VERIFY_BASE_URL') ?? 'https://gstverify.co.in';
  }

  async lookupGstin(gstNumber: string): Promise<GstVerifyResult | null> {
    if (!this.apiKey || this.apiKey.startsWith('dev_')) {
      return this.stubbedLookup(gstNumber);
    }

    const response = await axios.get(
      `${this.baseUrl}/api/v1/verify/${gstNumber}`,
      {
        headers: { 'X-API-Key': this.apiKey },
        validateStatus: () => true,
      },
    );

    if (!response.data?.success || !response.data?.data) {
      return null;
    }

    const d = response.data.data;
    return {
      gstin: d.gstin ?? gstNumber,
      status: d.status ?? 'Unknown',
      legalName: d.legal_name ?? null,
      tradeName: d.trade_name ?? null,
    };
  }

  private stubbedLookup(gstNumber: string): GstVerifyResult {
    this.logger.log(`[DEV GST] Stubbing gstverify.co.in lookup for ${gstNumber} (configure GST_VERIFY_API_KEY for live data)`);
    return {
      gstin: gstNumber,
      status: 'Active',
      legalName: `Registered Business ${gstNumber.slice(2, 7)}`,
      tradeName: `Trade Name ${gstNumber.slice(2, 7)}`,
    };
  }
}
