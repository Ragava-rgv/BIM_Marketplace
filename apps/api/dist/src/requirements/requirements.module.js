"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const storage_module_1 = require("../storage/storage.module");
const notifications_module_1 = require("../notifications/notifications.module");
const requirements_controller_1 = require("./requirements.controller");
const quotes_controller_1 = require("./quotes.controller");
const requirements_service_1 = require("./requirements.service");
let RequirementsModule = class RequirementsModule {
};
exports.RequirementsModule = RequirementsModule;
exports.RequirementsModule = RequirementsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, storage_module_1.StorageModule, notifications_module_1.NotificationsModule],
        controllers: [requirements_controller_1.RequirementsController, quotes_controller_1.QuotesController],
        providers: [requirements_service_1.RequirementsService],
        exports: [requirements_service_1.RequirementsService],
    })
], RequirementsModule);
//# sourceMappingURL=requirements.module.js.map