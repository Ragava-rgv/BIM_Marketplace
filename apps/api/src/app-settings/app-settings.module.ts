import { Module } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { AdminSettingsController, PublicSettingsController } from './app-settings.controller';

@Module({
  controllers: [PublicSettingsController, AdminSettingsController],
  providers: [AppSettingsService],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
