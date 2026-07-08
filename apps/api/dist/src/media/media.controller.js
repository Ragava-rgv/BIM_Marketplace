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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const storage_service_1 = require("../storage/storage.service");
const CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
};
let MediaController = class MediaController {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async stream(subfolder, filename, res) {
        const key = `${subfolder}/${filename}`;
        if (!(await this.storage.exists(key))) {
            throw new common_1.NotFoundException('File not found');
        }
        const contentType = CONTENT_TYPES[(0, path_1.extname)(filename).toLowerCase()] ?? 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        (0, fs_1.createReadStream)(this.storage.resolveKey(key)).pipe(res);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Get)(':subfolder/:filename'),
    __param(0, (0, common_1.Param)('subfolder')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "stream", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], MediaController);
//# sourceMappingURL=media.controller.js.map