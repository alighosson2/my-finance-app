"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../util/logger"));
const requestLogger = (req, res, next) => {
    res.on("finish", () => {
        const status = res.statusCode;
        const { method, originalUrl } = req;
        let level = "info";
        if (status >= 500) {
            level = "error";
        }
        else if (status >= 400) {
            level = "warn";
        }
        logger_1.default.log({ level, message: `${method} ${status} ${originalUrl}`, });
    });
    next();
};
exports.default = requestLogger;
//# sourceMappingURL=requestLogger.js.map