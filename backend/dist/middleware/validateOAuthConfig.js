"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOAuthConfig = void 0;
const config_1 = __importDefault(require("../config"));
const validateOAuthConfig = (req, res, next) => {
    const requiredFields = [
        'consumerKey',
        'consumerSecret',
        'baseUrl',
        'callbackUrl'
    ];
    const missingFields = requiredFields.filter(field => !config_1.default.openBank[field]);
    if (missingFields.length > 0) {
        res.status(500).json({
            message: 'OAuth configuration incomplete',
            missingFields
        });
        return;
    }
    next();
};
exports.validateOAuthConfig = validateOAuthConfig;
//w
//# sourceMappingURL=validateOAuthConfig.js.map