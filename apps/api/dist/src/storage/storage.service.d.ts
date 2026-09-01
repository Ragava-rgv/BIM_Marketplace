import { ConfigService } from '@nestjs/config';
export declare const LISTING_PHOTOS_DIR = "listing-photos";
export declare const LISTING_VIDEOS_DIR = "listing-videos";
export declare const REQUIREMENT_PHOTOS_DIR = "requirement-photos";
export declare const REQUIREMENT_VIDEOS_DIR = "requirement-videos";
export declare const QUOTE_PHOTOS_DIR = "quote-photos";
export declare const CERTIFICATION_REPORTS_DIR = "certification-reports";
export declare const CATEGORY_IMAGES_DIR = "category-images";
export declare const ADVERTISEMENT_IMAGES_DIR = "advertisement-images";
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
