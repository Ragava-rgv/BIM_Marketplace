"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const gst_module_1 = require("./gst/gst.module");
const storage_module_1 = require("./storage/storage.module");
const media_module_1 = require("./media/media.module");
const listings_module_1 = require("./listings/listings.module");
const enquiries_module_1 = require("./enquiries/enquiries.module");
const transactions_module_1 = require("./transactions/transactions.module");
const certifications_module_1 = require("./certifications/certifications.module");
const finance_partners_module_1 = require("./finance-partners/finance-partners.module");
const loans_module_1 = require("./loans/loans.module");
const buyback_module_1 = require("./buyback/buyback.module");
const depreciation_module_1 = require("./depreciation/depreciation.module");
const admin_module_1 = require("./admin/admin.module");
const payments_module_1 = require("./payments/payments.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const subscription_plans_module_1 = require("./subscription-plans/subscription-plans.module");
const buyer_subscription_plans_module_1 = require("./buyer-subscription-plans/buyer-subscription-plans.module");
const buyer_subscriptions_module_1 = require("./buyer-subscriptions/buyer-subscriptions.module");
const catalog_module_1 = require("./catalog/catalog.module");
const app_settings_module_1 = require("./app-settings/app-settings.module");
const wishlist_module_1 = require("./wishlist/wishlist.module");
const boost_plans_module_1 = require("./boost-plans/boost-plans.module");
const listing_boosts_module_1 = require("./listing-boosts/listing-boosts.module");
const advertisements_module_1 = require("./advertisements/advertisements.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', '..', 'web', 'dist'),
                exclude: ['/api/{*splat}', '/media/{*splat}'],
            }),
            prisma_module_1.PrismaModule,
            payments_module_1.PaymentsModule,
            auth_module_1.AuthModule,
            gst_module_1.GstModule,
            storage_module_1.StorageModule,
            media_module_1.MediaModule,
            listings_module_1.ListingsModule,
            enquiries_module_1.EnquiriesModule,
            transactions_module_1.TransactionsModule,
            certifications_module_1.CertificationsModule,
            finance_partners_module_1.FinancePartnersModule,
            loans_module_1.LoansModule,
            buyback_module_1.BuybackModule,
            depreciation_module_1.DepreciationModule,
            admin_module_1.AdminModule,
            subscriptions_module_1.SubscriptionsModule,
            subscription_plans_module_1.SubscriptionPlansModule,
            buyer_subscription_plans_module_1.BuyerSubscriptionPlansModule,
            buyer_subscriptions_module_1.BuyerSubscriptionsModule,
            catalog_module_1.CatalogModule,
            app_settings_module_1.AppSettingsModule,
            wishlist_module_1.WishlistModule,
            boost_plans_module_1.BoostPlansModule,
            listing_boosts_module_1.ListingBoostsModule,
            advertisements_module_1.AdvertisementsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map