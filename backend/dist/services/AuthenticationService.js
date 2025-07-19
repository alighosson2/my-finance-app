"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const AuthenticationExceptions_1 = require("../exceptions/AuthenticationExceptions");
const ServiceException_1 = require("../exceptions/ServiceException");
const logger_1 = __importDefault(require("../util/logger"));
const ms_1 = __importDefault(require("ms"));
class AuthenticationService {
    constructor(secretKey = config_1.default.auth.secretKey, tokenExpiration = config_1.default.auth.tokenExpiration, refreshTokenExpiration = config_1.default.auth.refreshTokenExpiration) {
        this.secretKey = secretKey;
        this.tokenExpiration = tokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, this.secretKey, { expiresIn: this.tokenExpiration });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, this.secretKey, { expiresIn: this.refreshTokenExpiration });
    }
    verify(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secretKey);
        }
        catch (error) {
            logger_1.default.error('token verification failed', error);
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new AuthenticationExceptions_1.TOkenEXpiredExpection();
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AuthenticationExceptions_1.InvalidTokenException();
            }
            throw new ServiceException_1.ServiceException('Token verifiaction failed');
        }
    }
    refreshToken(refreshToken) {
        const payload = this.verify(refreshToken);
        if (!payload) {
            throw new AuthenticationExceptions_1.InvalidTokenException();
        }
        ;
        return this.generateToken(payload.userId);
    }
    setTokenIntoCookie(res, token) {
        res.cookie('token', token, {
            httpOnly: true,
            secure: config_1.default.isProduction,
            maxAge: (0, ms_1.default)(this.tokenExpiration),
        });
    }
    setRefreshTokenIntoCookie(res, token) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: config_1.default.isProduction,
            maxAge: (0, ms_1.default)(this.refreshTokenExpiration),
        });
    }
    clearTokens(res) {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
    }
    persistAuthentication(res, userId) {
        const token = this.generateToken(userId);
        const refreshToken = this.generateRefreshToken(userId);
        this.setTokenIntoCookie(res, token);
        this.setRefreshTokenIntoCookie(res, refreshToken);
        ///remember persist
    }
}
exports.AuthenticationService = AuthenticationService;
//5:11,15:51,15:52,42:35
//# sourceMappingURL=AuthenticationService.js.map