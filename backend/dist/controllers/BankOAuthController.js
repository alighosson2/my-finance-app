"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOAuthSignature = exports.authCallback = exports.startAuth = void 0;
// src/controllers/BankOAuthController.ts - Fixed OAuth implementation
const axios_1 = __importDefault(require("axios"));
const OAuthHelper_1 = require("../util/OAuthHelper");
const config_1 = __importDefault(require("../config"));
// In-memory storage for demo - use database in production
let tokenSecrets = {};
const startAuth = async (req, res) => {
    console.log('🚀 Starting OAuth flow...');
    try {
        // Check config first
        if (!config_1.default.openBank.consumerKey || !config_1.default.openBank.consumerSecret) {
            console.error('❌ Missing OAuth credentials');
            res.status(500).json({
                message: 'OAuth configuration missing',
                details: 'Consumer key or secret not found'
            });
            return;
        }
        const oauth = (0, OAuthHelper_1.getOAuth)();
        console.log('✅ OAuth helper initialized');
        // Create request with callback URL as data parameter
        const request_data = (0, OAuthHelper_1.createOAuthRequest)(`${config_1.default.openBank.baseUrl}/oauth/initiate`, 'POST', {
            oauth_callback: config_1.default.openBank.callbackUrl
        });
        console.log('📡 Making OAuth initiate request to:', request_data.url);
        console.log('📡 Callback URL:', config_1.default.openBank.callbackUrl);
        // Generate OAuth signature
        const { oauthData, header } = (0, OAuthHelper_1.debugOAuthSignature)(request_data);
        // OBP expects NO request body for /oauth/initiate - all params go in header
        const response = await (0, axios_1.default)({
            method: 'POST',
            url: request_data.url,
            headers: {
                ...header,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MyFinance360/1.0',
                'Accept': 'application/x-www-form-urlencoded'
            },
            // No data in body - OBP gets oauth_callback from Authorization header
            timeout: 15000,
            validateStatus: (status) => status < 500
        });
        console.log('✅ OBP responded with status:', response.status);
        console.log('📥 Response headers:', response.headers);
        console.log('📥 Response data:', response.data);
        if (response.status !== 200) {
            throw new Error(`OBP returned status ${response.status}: ${JSON.stringify(response.data)}`);
        }
        // Parse response
        let oauth_token = null;
        let oauth_token_secret = null;
        if (typeof response.data === 'string') {
            const params = new URLSearchParams(response.data);
            oauth_token = params.get('oauth_token');
            oauth_token_secret = params.get('oauth_token_secret');
        }
        else if (typeof response.data === 'object') {
            oauth_token = response.data.oauth_token;
            oauth_token_secret = response.data.oauth_token_secret;
        }
        console.log('🔍 Parsed tokens:', { oauth_token, oauth_token_secret });
        if (!oauth_token || !oauth_token_secret) {
            throw new Error(`Missing tokens in response. Data: ${JSON.stringify(response.data)}`);
        }
        // Store the token secret for later use
        tokenSecrets[oauth_token] = oauth_token_secret;
        console.log('🔑 Tokens stored successfully');
        const redirectUrl = `${config_1.default.openBank.baseUrl}/oauth/authorize?oauth_token=${oauth_token}`;
        console.log('🔀 Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    }
    catch (err) {
        console.error('❌ OAuth error details:', err.message);
        if (err.response) {
            console.error('- Response status:', err.response.status);
            console.error('- Response data:', err.response.data);
            console.error('- Response headers:', err.response.headers);
        }
        res.status(500).json({
            message: 'OAuth start failed',
            error: err.response?.data || err.message,
            details: {
                timestamp: Math.floor(Date.now() / 1000),
                url: err.config?.url,
                status: err.response?.status
            }
        });
    }
};
exports.startAuth = startAuth;
const authCallback = async (req, res) => {
    console.log('🔄 OAuth callback received');
    console.log('Query params:', req.query);
    try {
        const { oauth_token, oauth_verifier } = req.query;
        if (!oauth_token || !oauth_verifier) {
            console.error('❌ Missing callback parameters');
            res.status(400).json({
                message: 'Missing oauth_token or oauth_verifier',
                received: req.query
            });
            return;
        }
        const oauth_token_secret = tokenSecrets[oauth_token];
        if (!oauth_token_secret) {
            console.error('❌ Token secret not found for token:', oauth_token);
            console.error('Available tokens:', Object.keys(tokenSecrets));
            res.status(400).json({
                message: 'Invalid oauth_token or session expired',
                token: oauth_token
            });
            return;
        }
        // Create the access token request
        const request_data = (0, OAuthHelper_1.createOAuthRequest)(`${config_1.default.openBank.baseUrl}/oauth/token`, 'POST', {
            oauth_verifier: oauth_verifier
        });
        const token = {
            key: oauth_token,
            secret: oauth_token_secret,
        };
        console.log('🔄 Exchanging request token for access token...');
        // Generate OAuth signature for access token request
        const { header } = (0, OAuthHelper_1.debugOAuthSignature)(request_data, token);
        // For /oauth/token, OBP expects NO request body - oauth_verifier goes in header
        const response = await (0, axios_1.default)({
            method: 'POST',
            url: request_data.url,
            headers: {
                ...header,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/x-www-form-urlencoded'
            },
            // No data in body - OBP gets oauth_verifier from Authorization header
            timeout: 15000
        });
        console.log('✅ Access token response received');
        console.log('Response data:', response.data);
        if (response.status !== 200) {
            throw new Error(`Access token request failed with status ${response.status}: ${response.data}`);
        }
        const finalParams = new URLSearchParams(response.data);
        const access_token = finalParams.get('oauth_token');
        const access_token_secret = finalParams.get('oauth_token_secret');
        if (!access_token || !access_token_secret) {
            throw new Error(`Missing access tokens in response. Data: ${response.data}`);
        }
        // Clean up the request token
        delete tokenSecrets[oauth_token];
        console.log('🎉 OAuth flow completed successfully');
        res.status(200).json({
            message: 'Bank connected successfully!',
            access_token,
            access_token_secret,
        });
    }
    catch (err) {
        console.error('❌ OAuth callback error:', err?.response?.data || err.message || err);
        res.status(500).json({
            message: 'OAuth callback failed',
            error: err.message,
            details: err.response?.data
        });
    }
};
exports.authCallback = authCallback;
const testOAuthSignature = async (req, res) => {
    console.log('🧪 Testing OAuth signature generation...');
    try {
        // Test basic config
        const configTest = {
            consumerKey: config_1.default.openBank.consumerKey,
            hasConsumerSecret: !!config_1.default.openBank.consumerSecret,
            baseUrl: config_1.default.openBank.baseUrl,
            callbackUrl: config_1.default.openBank.callbackUrl
        };
        console.log('📋 Config test:', configTest);
        // Test OAuth helper
        const oauth = (0, OAuthHelper_1.getOAuth)();
        console.log('✅ OAuth helper created');
        // Test signature generation
        const testRequest = (0, OAuthHelper_1.createOAuthRequest)(`${config_1.default.openBank.baseUrl}/oauth/initiate`, 'POST', { oauth_callback: config_1.default.openBank.callbackUrl });
        console.log('🔧 Test request:', testRequest);
        const { oauthData, header } = (0, OAuthHelper_1.debugOAuthSignature)(testRequest);
        // Test connectivity to OBP
        console.log('🌐 Testing connectivity to OBP...');
        try {
            const connectivityTest = await (0, axios_1.default)({
                method: 'GET',
                url: `${config_1.default.openBank.baseUrl}/obp/v4.0.0/api`,
                timeout: 10000
            });
            console.log('✅ OBP connectivity test passed:', connectivityTest.status);
        }
        catch (connErr) {
            console.log('❌ OBP connectivity test failed:', connErr.message);
        }
        res.json({
            message: 'OAuth signature test completed',
            config: configTest,
            authData: oauthData,
            header,
            testRequest,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ OAuth test failed:', error);
        res.status(500).json({
            message: 'OAuth test failed',
            error: error.message,
            stack: error.stack
        });
    }
};
exports.testOAuthSignature = testOAuthSignature;
//# sourceMappingURL=BankOAuthController.js.map