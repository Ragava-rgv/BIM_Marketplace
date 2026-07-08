import { ConfigService } from '@nestjs/config';
export declare const LISTING_PHOTOS_DIR = "listing-photos";
export declare const LISTING_VIDEOS_DIR = "listing-videos";
export declare const CERTIFICATION_REPORTS_DIR = "certification-reports";
export declare const CATEGORY_IMAGES_DIR = "category-images";
export interface UploadedObject {
    key: string;
    url: string;
}
export declare class StorageService {
    private readonly config;
    private readonly rootPath;
    private readonly mediaBaseUrl;
    constructor(config: ConfigService);
    upload(file: Express.Multer.File, subfolder: string): Promise<UploadedObject>;
    write(key: string, data: Buffer): Promise<void>;
    getUrl(key: string): string;
    resolveKey(key: string): string;
    exists(key: string): Promise<boolean>;
}
