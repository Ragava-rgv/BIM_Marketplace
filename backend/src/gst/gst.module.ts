import { Module } from '@nestjs/common';
import { GstController } from './gst.controller';
import { GstService } from './gst.service';
import { GstVerifyClient } from './masters-india.client';

@Module({
  controllers: [GstController],
  providers: [GstService, GstVerifyClient],
  exports: [GstService],
})
export class GstModule {}
