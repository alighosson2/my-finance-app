"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const BadRequestException_1 = require("../exceptions/BadRequestException");
const NotFoundException_1 = require("../exceptions/NotFoundException");
const ServiceException_1 = require("../exceptions/ServiceException");
const logger_1 = __importDefault(require("../util/logger"));
const errorHandler = (error, req, res, next) => {
    logger_1.default.error('Error occurred:', error);
    if (error instanceof BadRequestException_1.BadRequestException) {
        res.status(400).json({
            error: 'Bad Request',
            message: error.message,
        });
        return;
    }
    if (error instanceof NotFoundException_1.NotFoundException) {
        res.status(404).json({
            error: 'Not Found',
            message: error.message,
        });
        return;
    }
    if (error instanceof ServiceException_1.ServiceException) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
        return;
    }
    // Default error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    });
};
exports.errorHandler = errorHandler;
// Async error wrapper to catch async errors in controllers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorMiddleware.js.map