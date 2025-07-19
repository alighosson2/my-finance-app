"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OBPDataService = void 0;
// src/services/OBPDataService.ts - Open Bank Project API Data Fetching Service
const axios_1 = __importDefault(require("axios"));
const OAuthHelper_1 = require("../util/OAuthHelper");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../util/logger"));
// Service for interacting with OBP API
class OBPDataService {
    constructor() {
        this.baseUrl = config_1.default.openBank.baseUrl;
    }
    /**
     * Makes an authenticated request to OBP API using OAuth 1.0a
     */
    async makeOAuthRequest(endpoint, method, accessToken, accessTokenSecret, data) {
        try {
            const fullUrl = `${this.baseUrl}${endpoint}`;
            // Create OAuth signed request
            const requestData = (0, OAuthHelper_1.createOAuthRequest)(fullUrl, method, data || {});
            // Get OAuth helper to generate signature
            const oauth = (0, OAuthHelper_1.getOAuth)();
            // Create token object for signing
            const token = {
                key: accessToken,
                secret: accessTokenSecret
            };
            // Generate OAuth header
            const authHeader = oauth.toHeader(oauth.authorize(requestData, token));
            logger_1.default.info(`🔗 Making OBP API request to: ${endpoint}`);
            const response = await (0, axios_1.default)({
                method: method,
                url: fullUrl,
                headers: {
                    'Authorization': authHeader.Authorization,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'MyFinance360/1.0'
                },
                data: method !== 'GET' ? data : undefined,
                timeout: 30000,
                validateStatus: (status) => status < 500
            });
            if (response.status !== 200) {
                throw new Error(`OBP API returned status ${response.status}: ${JSON.stringify(response.data)}`);
            }
            logger_1.default.info(`✅ OBP API request successful: ${endpoint}`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`❌ OBP API request failed for ${endpoint}:`, {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`OBP API request failed: ${error.message}`);
        }
    }
    /**
     * Fetch all accounts for the authenticated user
     */
    async fetchAccounts(accessToken, accessTokenSecret) {
        try {
            logger_1.default.info('🏦 Fetching accounts from OBP API...');
            const response = await this.makeOAuthRequest('/obp/v4.0.0/my/accounts', 'GET', accessToken, accessTokenSecret);
            logger_1.default.info(`✅ Fetched ${response.accounts.length} accounts from OBP`);
            return response.accounts;
        }
        catch (error) {
            logger_1.default.error('❌ Failed to fetch accounts from OBP:', error);
            throw error;
        }
    }
    /**
     * Fetch transactions for a specific account
     */
    async fetchTransactions(accountId, bankId, accessToken, accessTokenSecret, limit = 100) {
        try {
            logger_1.default.info(`💰 Fetching transactions for account ${accountId} from OBP API...`);
            const endpoint = `/obp/v4.0.0/my/accounts/${accountId}/transactions?limit=${limit}`;
            const response = await this.makeOAuthRequest(endpoint, 'GET', accessToken, accessTokenSecret);
            logger_1.default.info(`✅ Fetched ${response.transactions.length} transactions from OBP`);
            return response.transactions;
        }
        catch (error) {
            logger_1.default.error(`❌ Failed to fetch transactions for account ${accountId}:`, error);
            throw error;
        }
    }
    /**
     * Fetch account details by ID
     */
    async fetchAccountDetails(accountId, bankId, accessToken, accessTokenSecret) {
        try {
            logger_1.default.info(`🔍 Fetching account details for ${accountId} from OBP API...`);
            const response = await this.makeOAuthRequest(`/obp/v4.0.0/my/accounts/${accountId}`, 'GET', accessToken, accessTokenSecret);
            logger_1.default.info(`✅ Fetched account details for ${accountId}`);
            return response;
        }
        catch (error) {
            logger_1.default.error(`❌ Failed to fetch account details for ${accountId}:`, error);
            throw error;
        }
    }
    /**
     * Test the OBP API connection
     */
    async testConnection(accessToken, accessTokenSecret) {
        try {
            logger_1.default.info('🧪 Testing OBP API connection...');
            // Try to fetch user info as a simple test
            await this.makeOAuthRequest('/obp/v4.0.0/users/current', 'GET', accessToken, accessTokenSecret);
            logger_1.default.info('✅ OBP API connection test successful');
            return true;
        }
        catch (error) {
            logger_1.default.error('❌ OBP API connection test failed:', error);
            return false;
        }
    }
    /**
     * Map OBP account type to our internal account type enum
     */
    mapAccountType(obpAccountType) {
        const typeMapping = {
            'CURRENT': 'checking',
            'SAVINGS': 'savings',
            'CREDIT': 'credit_card',
            'INVESTMENT': 'investment',
            'LOAN': 'loan',
            'DEPOSIT': 'savings'
        };
        return typeMapping[obpAccountType.toUpperCase()] || 'other';
    }
    /**
     * Map OBP transaction amount to our transaction type
     */
    mapTransactionType(amount) {
        const numAmount = parseFloat(amount);
        if (numAmount > 0) {
            return 'income';
        }
        else if (numAmount < 0) {
            return 'expense';
        }
        else {
            return 'transfer';
        }
    }
    /**
     * Extract merchant name from OBP transaction
     */
    extractMerchantName(transaction) {
        // Try multiple sources for merchant name
        if (transaction.counterparty?.name) {
            return transaction.counterparty.name;
        }
        if (transaction.counterparty?.holder?.name) {
            return transaction.counterparty.holder.name;
        }
        if (transaction.metadata?.narrative) {
            return transaction.metadata.narrative;
        }
        return transaction.details?.description || null;
    }
}
exports.OBPDataService = OBPDataService;
//# sourceMappingURL=OBPDataService.js.map