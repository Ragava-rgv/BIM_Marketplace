"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFinancePartnerDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_finance_partner_dto_1 = require("./create-finance-partner.dto");
class UpdateFinancePartnerDto extends (0, mapped_types_1.PartialType)(create_finance_partner_dto_1.CreateFinancePartnerDto) {
}
exports.UpdateFinancePartnerDto = UpdateFinancePartnerDto;
//# sourceMappingURL=update-finance-partner.dto.js.map