import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';

export const LISTING_PHOTOS_DIR = 'listing-photos';
export const LISTING_VIDEOS_DIR = 'listing-videos';
export const CERTIFICATION_REPORTS_DIR = 'certification-reports';
export const CATEGORY_IMAGES_DIR = 'category-images';

export interface UploadedObject {
  /** S3-compatible relative key, e.g. "listing-photos/<uuid>.jpg" — stored in storage_key columns. */
  key: string;
  /** Fully-qualified URL clients use to fetch the file via /media/:key. */
  url: string;
}

/**
 * Encapsulates ALL local-disk file handling behind upload()/getUrl()/readStream().
 * To migrate to AWS S3, replace only this service's implementation — the
 * `storage_key` values are already structured as S3-compatible prefixed keys
 * (see project_spec.md §9), so no schema or business-logic changes are needed.
 */
@Injectable()
export class StorageService {
  private readonly rootPath: string;
  private readonly mediaBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.rootPath = resolve(this.config.get<string>('STORAGE_LOCAL_PATH') ?? './uploads');
    this.mediaBaseUrl = (this.config.get<string>('MEDIA_BASE_URL') ?? 'http://localhost:3001/media').replace(/\/$/, '');
  }

  async upload(file: Express.Multer.File, subfolder: string): Promise<UploadedObject> {
    const key = `${subfolder}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    await this.write(key, file.buffer);
    return { key, url: this.getUrl(key) };
  }

  async write(key: string, data: Buffer): Promise<void> {
    const fullPath = this.resolveKey(key);
    await fs.mkdir(join(fullPath, '..'), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  getUrl(key: string): string {
    return `${this.mediaBaseUrl}/${key}`;
  }

  resolveKey(key: string): string {
    return join(this.rootPath, key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}
