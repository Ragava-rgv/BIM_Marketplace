import { Module } from '@nestjs/common';
import { ContactPaymentsController } from './contact-payments.controller';
import { ContactPaymentsService } from './contact-payments.service';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [AppSettingsModule],
  controllers: [ContactPaymentsController],
  providers: [ContactPaymentsService],
})
export class ContactPaymentsModule {}
