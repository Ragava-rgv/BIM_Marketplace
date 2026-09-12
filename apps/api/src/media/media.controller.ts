import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { StorageService } from '../storage/storage.service';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};

/** Streams uploaded files from local disk; mirrors the future S3 object URL shape. */
@Controller('media')
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  @Get(':subfolder/:filename')
  async stream(
    @Param('subfolder') subfolder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const key = `${subfolder}/${filename}`;
    if (!(await this.storage.exists(key))) {
      throw new NotFoundException('File not found');
    }

    const contentType =
      CONTENT_TYPES[extname(filename).toLowerCase()] ??
      'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    createReadStream(this.storage.resolveKey(key)).pipe(res);
  }
}
