"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GstVerifyClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstVerifyClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let GstVerifyClient = GstVerifyClient_1 = class GstVerifyClient {
    config;
    logger = new common_1.Logger(GstVerifyClient_1.name);
    apiKey;
    baseUrl;
    constructor(config) {
        this.config = config;
        this.apiKey = this.config.get('GST_VERIFY_API_KEY');
        this.baseUrl = this.config.get('GST_VERIFY_BASE_URL') ?? 'https://gstverify.co.in';
    }
    async lookupGstin(gstNumber) {
        if (!this.apiKey || this.apiKey.startsWith('dev_')) {
            return this.stubbedLookup(gstNumber);
        }
        const response = await axios_1.default.get(`${this.baseUrl}/api/v1/verify/${gstNumber}`, {
            headers: { 'X-API-Key': this.apiKey },
            validateStatus: () => true,
        });
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
    stubbedLookup(gstNumber) {
        this.logger.log(`[DEV GST] Stubbing gstverify.co.in lookup for ${gstNumber} (configure GST_VERIFY_API_KEY for live data)`);
        return {
            gstin: gstNumber,
            status: 'Active',
            legalName: `Registered Business ${gstNumber.slice(2, 7)}`,
            tradeName: `Trade Name ${gstNumber.slice(2, 7)}`,
        };
    }
};
exports.GstVerifyClient = GstVerifyClient;
exports.GstVerifyClient = GstVerifyClient = GstVerifyClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GstVerifyClient);
//# sourceMappingURL=masters-india.client.js.map