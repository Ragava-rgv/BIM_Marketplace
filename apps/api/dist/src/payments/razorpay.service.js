"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
let RazorpayService = RazorpayService_1 = class RazorpayService {
    config;
    logger = new common_1.Logger(RazorpayService_1.name);
    _razorpay = null;
    keyId;
    keySecret;
    constructor(config) {
        this.config = config;
        this.keyId = this.config.get('RAZORPAY_KEY_ID') ?? '';
        this.keySecret = this.config.get('RAZORPAY_KEY_SECRET') ?? '';
        if (!this.keyId || !this.keySecret) {
            this.logger.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment features disabled');
        }
    }
    get razorpay() {
        if (!this._razorpay) {
            if (!this.keyId || !this.keySecret) {
                throw new common_1.ServiceUnavailableException('Payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
            }
            this._razorpay = new razorpay_1.default({ key_id: this.keyId, key_secret: this.keySecret });
        }
        return this._razorpay;
    }
    async createOrder(amountInr, receiptId) {
        return this.razorpay.orders.create({
            amount: amountInr * 100,
            currency: 'INR',
            receipt: receiptId.slice(0, 40),
        });
    }
    verifySignature(orderId, paymentId, signature) {
        const body = `${orderId}|${paymentId}`;
        const expected = crypto.createHmac('sha256', this.keySecret).update(body).digest('hex');
        return expected === signature;
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map