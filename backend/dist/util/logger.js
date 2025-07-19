"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
const { logDir, isDev } = config_1.default;
const logFileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.splat(), winston_1.default.format.errors({ stack: true }));
const logConsoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: "HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${message} ${stack || ""}`;
}));
const logger = winston_1.default.createLogger({
    level: "info",
    transports: [
        new winston_1.default.transports.File({ filename: "error.log", dirname: logDir, level: "error", format: logFileFormat }),
        new winston_1.default.transports.File({ filename: "all.log", dirname: logDir })
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: "exceptions.logs", dirname: logDir })
    ]
});
if (isDev) {
    logger.add(new winston_1.default.transports.Console({ format: logConsoleFormat }));
    logger.level = "debug";
}
exports.default = logger;
//# sourceMappingURL=logger.js.map