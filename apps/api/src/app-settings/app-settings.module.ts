import { Module } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { AdminSettingsController } from './app-settings.controller';

@Module({
  controllers: [AdminSettingsController],
  providers: [AppSettingsService],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
