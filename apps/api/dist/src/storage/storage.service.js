"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.ADVERTISEMENT_IMAGES_DIR = exports.CATEGORY_IMAGES_DIR = exports.CERTIFICATION_REPORTS_DIR = exports.LISTING_VIDEOS_DIR = exports.LISTING_PHOTOS_DIR = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
exports.LISTING_PHOTOS_DIR = 'listing-photos';
exports.LISTING_VIDEOS_DIR = 'listing-videos';
exports.CERTIFICATION_REPORTS_DIR = 'certification-reports';
exports.CATEGORY_IMAGES_DIR = 'category-images';
exports.ADVERTISEMENT_IMAGES_DIR = 'advertisement-images';
let StorageService = class StorageService {
    config;
    rootPath;
    mediaBaseUrl;
    constructor(config) {
        this.config = config;
        this.rootPath = (0, path_1.resolve)(this.config.get('STORAGE_LOCAL_PATH') ?? './uploads');
        this.mediaBaseUrl = (this.config.get('MEDIA_BASE_URL') ?? 'http://localhost:3001/media').replace(/\/$/, '');
    }
    async upload(file, subfolder) {
        const key = `${subfolder}/${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`;
        await this.write(key, file.buffer);
        return { key, url: this.getUrl(key) };
    }
    async write(key, data) {
        const fullPath = this.resolveKey(key);
        await fs_1.promises.mkdir((0, path_1.join)(fullPath, '..'), { recursive: true });
        await fs_1.promises.writeFile(fullPath, data);
    }
    getUrl(key) {
        return `${this.mediaBaseUrl}/${key}`;
    }
    resolveKey(key) {
        return (0, path_1.join)(this.rootPath, key);
    }
    async exists(key) {
        try {
            await fs_1.promises.access(this.resolveKey(key));
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map