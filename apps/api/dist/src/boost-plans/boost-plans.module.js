"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoostPlansModule = void 0;
const common_1 = require("@nestjs/common");
const boost_plans_service_1 = require("./boost-plans.service");
const boost_plans_controller_1 = require("./boost-plans.controller");
let BoostPlansModule = class BoostPlansModule {
};
exports.BoostPlansModule = BoostPlansModule;
exports.BoostPlansModule = BoostPlansModule = __decorate([
    (0, common_1.Module)({
        controllers: [boost_plans_controller_1.BoostPlansController],
        providers: [boost_plans_service_1.BoostPlansService],
        exports: [boost_plans_service_1.BoostPlansService],
    })
], BoostPlansModule);
//# sourceMappingURL=boost-plans.module.js.map