"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerSubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_subscriptions_controller_1 = require("./buyer-subscriptions.controller");
const buyer_subscriptions_service_1 = require("./buyer-subscriptions.service");
let BuyerSubscriptionsModule = class BuyerSubscriptionsModule {
};
exports.BuyerSubscriptionsModule = BuyerSubscriptionsModule;
exports.BuyerSubscriptionsModule = BuyerSubscriptionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [buyer_subscriptions_controller_1.BuyerSubscriptionsController, buyer_subscriptions_controller_1.AdminBuyerSubscriptionsController],
        providers: [buyer_subscriptions_service_1.BuyerSubscriptionsService],
        exports: [buyer_subscriptions_service_1.BuyerSubscriptionsService],
    })
], BuyerSubscriptionsModule);
//# sourceMappingURL=buyer-subscriptions.module.js.map