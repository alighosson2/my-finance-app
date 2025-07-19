"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.default = {
    logDir: process.env.LOG_DIR || './logs',
    isDev: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: process.env.HOST || 'localhost',
    frontendPath: path_1.default.join(__dirname, '../../frontend'),
    auth: {
        secretKey: process.env.JWT_SECRET_KEY || 'secret12345678',
        tokenExpiration: (process.env.TOKEN_EXPIRATION || '1h'),
        refreshTokenExpiration: (process.env.REFRESH_TOKEN_EXPIRATION || '7d'),
    },
    openBank: {
        consumerKey: process.env.OBP_CONSUMER_KEY || 'cjy5f0znivmgiothypjzwnyhi53ruz5o44vczzrf',
        consumerSecret: process.env.OBP_CONSUMER_SECRET || 'cjvkam3rd35boxmdahnjsmhy5hzr2s1wn3rsp5oj',
        baseUrl: process.env.OBP_BASE_URL || 'https://apisandbox.openbankproject.com',
        callbackUrl: process.env.OBP_CALLBACK_URL || 'http://localhost:3000/api/bank/callback',
    },
};
//# sourceMappingURL=index.js.map