"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugOAuthSignature = exports.createOAuthRequest = exports.getOAuth = void 0;
exports.oauthPercentEncode = oauthPercentEncode;
// src/util/OAuthHelper.ts - Fixed OAuth implementation for OBP
const oauth_1_0a_1 = __importDefault(require("oauth-1.0a"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
// Standard OAuth 1.0a percent encoding
function oauthPercentEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
}
const getOAuth = () => {
    return new oauth_1_0a_1.default({
        consumer: {
            key: config_1.default.openBank.consumerKey,
            secret: config_1.default.openBank.consumerSecret,
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
            return crypto_1.default.createHmac('sha1', key).update(base_string).digest('base64');
        },
    });
};
exports.getOAuth = getOAuth;
const createOAuthRequest = (url, method, data) => {
    return {
        url,
        method: method.toUpperCase(),
        data: data || {}
    };
};
exports.createOAuthRequest = createOAuthRequest;
const debugOAuthSignature = (request, token) => {
    const oauth = (0, exports.getOAuth)();
    console.log('🔍 OAuth Debug Info:');
    console.log('- Request URL:', request.url);
    console.log('- Request Method:', request.method);
    console.log('- Request Data:', request.data);
    const oauthData = oauth.authorize(request, token);
    const header = oauth.toHeader(oauthData);
    console.log('- Generated OAuth Data:', oauthData);
    console.log('- Final Authorization Header:', header.Authorization);
    return { oauthData, header };
};
exports.debugOAuthSignature = debugOAuthSignature;
//# sourceMappingURL=OAuthHelper.js.map