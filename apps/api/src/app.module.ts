import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GstModule } from './gst/gst.module';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { ListingsModule } from './listings/listings.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CertificationsModule } from './certifications/certifications.module';
import { FinancePartnersModule } from './finance-partners/finance-partners.module';
import { LoansModule } from './loans/loans.module';
import { BuybackModule } from './buyback/buyback.module';
import { DepreciationModule } from './depreciation/depreciation.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { BuyerSubscriptionPlansModule } from './buyer-subscription-plans/buyer-subscription-plans.module';
import { BuyerSubscriptionsModule } from './buyer-subscriptions/buyer-subscriptions.module';
import { CatalogModule } from './catalog/catalog.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { BoostPlansModule } from './boost-plans/boost-plans.module';
import { ListingBoostsModule } from './listing-boosts/listing-boosts.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { RequirementsModule } from './requirements/requirements.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Serves the built React app from the same origin/port as the API, so the
    // frontend's hardcoded '/api' axios baseURL works with no separate host.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'web', 'dist'),
      exclude: ['/api/{*splat}', '/media/{*splat}'],
    }),
    PrismaModule,
    PaymentsModule,
    AuthModule,
    GstModule,
    StorageModule,
    MediaModule,
    ListingsModule,
    EnquiriesModule,
    TransactionsModule,
    CertificationsModule,
    FinancePartnersModule,
    LoansModule,
    BuybackModule,
    DepreciationModule,
    AdminModule,
    SubscriptionsModule,
    SubscriptionPlansModule,
    BuyerSubscriptionPlansModule,
    BuyerSubscriptionsModule,
    CatalogModule,
    AppSettingsModule,
    WishlistModule,
    BoostPlansModule,
    ListingBoostsModule,
    AdvertisementsModule,
    RequirementsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
