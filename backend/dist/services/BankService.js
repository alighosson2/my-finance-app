"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankService = void 0;
const BankRepository_1 = require("../Repositories/BankRepository");
const NotFoundException_1 = require("../exceptions/NotFoundException");
const OBPDataService_1 = require("./OBPDataService");
const FinancialAccountService_1 = require("./FinancialAccountService");
const TransactionService_1 = require("./TransactionService");
const logger_1 = __importDefault(require("../util/logger"));
class BankService {
    constructor() {
        this.bankRepository = null;
        this.obpService = new OBPDataService_1.OBPDataService();
        this.accountService = new FinancialAccountService_1.FinancialAccountService();
        this.transactionService = new TransactionService_1.TransactionService();
    }
    async getRepo() {
        if (!this.bankRepository) {
            this.bankRepository = new BankRepository_1.BankRepository();
            await this.bankRepository.init();
        }
        return this.bankRepository;
    }
    async createToken(dto) {
        const repo = await this.getRepo();
        // Validate user_id is provided
        if (!dto.user_id || dto.user_id <= 0) {
            throw new Error('Valid user_id is required');
        }
        const token = await repo.create({
            id: 0, // This will be ignored by the repository
            user_id: dto.user_id,
            provider: dto.provider,
            access_token: dto.access_token,
            access_token_secret: dto.access_token_secret || null,
            refresh_token: dto.refresh_token || null,
            expires_at: dto.expires_at,
            created_at: new Date(),
            updated_at: new Date()
        });
        const result = await repo.getTokenById(token.id);
        if (!result) {
            throw new Error('Failed to retrieve created token');
        }
        return result;
    }
    async getTokenById(id) {
        const repo = await this.getRepo();
        const token = await repo.getTokenById(id);
        if (!token) {
            throw new NotFoundException_1.NotFoundException('Bank token not found');
        }
        return token;
    }
    async getTokensByUser(userId) {
        return (await this.getRepo()).getTokensByUser(userId);
    }
    async updateToken(id, dto) {
        const repo = await this.getRepo();
        const existing = await repo.getTokenById(id);
        if (!existing) {
            throw new NotFoundException_1.NotFoundException('Token not found');
        }
        const updated = await repo.update(id, {
            id: existing.id,
            user_id: existing.user_id,
            provider: dto.provider ?? existing.provider,
            access_token: dto.access_token ?? existing.access_token,
            access_token_secret: dto.access_token_secret !== undefined ? dto.access_token_secret : existing.access_token_secret,
            refresh_token: dto.refresh_token !== undefined ? dto.refresh_token : existing.refresh_token,
            expires_at: dto.expires_at ?? existing.expires_at,
            created_at: existing.created_at,
            updated_at: new Date()
        });
        if (!updated) {
            throw new Error('Failed to update token');
        }
        const result = await repo.getTokenById(id);
        if (!result) {
            throw new Error('Failed to retrieve updated token');
        }
        return result;
    }
    async deleteToken(id) {
        const repo = await this.getRepo();
        const token = await repo.getTokenById(id);
        if (!token) {
            throw new NotFoundException_1.NotFoundException('Token not found');
        }
        await repo.delete(id);
    }
    async connectBankAccount(userId, dto) {
        return await this.createToken({
            ...dto,
            user_id: userId
        });
    }
    async getUserBankTokens(userId) {
        return await this.getTokensByUser(userId);
    }
    async revokeBankToken(userId, tokenId) {
        const token = await this.getTokenById(tokenId);
        if (token.user_id !== userId) {
            throw new NotFoundException_1.NotFoundException('Bank token not found for this user');
        }
        await this.deleteToken(tokenId);
    }
    // ===== OBP DATA SYNCING METHODS =====
    /**
     * Test OBP connection using stored bank token
     */
    async testOBPConnection(userId, tokenId) {
        try {
            const token = tokenId
                ? await this.getTokenById(tokenId)
                : (await this.getTokensByUser(userId)).find(t => t.provider === 'obp');
            if (!token) {
                throw new NotFoundException_1.NotFoundException('No OBP bank token found for user');
            }
            return await this.obpService.testConnection(token.access_token, token.access_token_secret || '');
        }
        catch (error) {
            logger_1.default.error('Failed to test OBP connection:', error);
            return false;
        }
    }
    /**
     * Sync accounts from OBP to our database
     */
    async syncAccountsFromOBP(userId, tokenId) {
        const result = { synced: 0, errors: [], accounts: [] };
        try {
            logger_1.default.info(`🔄 Starting OBP account sync for user ${userId}`);
            // Get user's OBP token
            const token = tokenId
                ? await this.getTokenById(tokenId)
                : (await this.getTokensByUser(userId)).find(t => t.provider === 'obp');
            if (!token) {
                throw new NotFoundException_1.NotFoundException('No OBP bank token found for user');
            }
            // Fetch accounts from OBP
            const obpAccounts = await this.obpService.fetchAccounts(token.access_token, token.access_token_secret || '');
            logger_1.default.info(`📥 Fetched ${obpAccounts.length} accounts from OBP`);
            // Process each account
            for (const obpAccount of obpAccounts) {
                try {
                    // Check if account already exists
                    const existingAccountsResult = await this.accountService.getAllAccounts(userId);
                    const existingAccount = existingAccountsResult.accounts.find((acc) => acc.external_account_id === obpAccount.id);
                    if (existingAccount && existingAccount.id) {
                        // Update existing account
                        await this.updateAccountFromOBP(existingAccount.id, obpAccount, token.id, userId);
                        logger_1.default.info(`✅ Updated existing account: ${obpAccount.label}`);
                    }
                    else {
                        // Create new account
                        const accountDto = {
                            user_id: userId,
                            bank_token_id: token.id,
                            account_name: obpAccount.label,
                            account_type: this.obpService.mapAccountType(obpAccount.account_type),
                            balance: parseFloat(obpAccount.balance.amount),
                            currency: obpAccount.balance.currency,
                            bank_name: `OBP Demo Bank (${obpAccount.bank_id})`,
                            account_number_masked: `****${obpAccount.id.slice(-4)}`,
                            external_account_id: obpAccount.id,
                            bank_id: obpAccount.bank_id
                        };
                        const newAccount = await this.accountService.createAccount(accountDto);
                        // Update with OBP-specific fields - ensure ID exists
                        if (newAccount.id) {
                            await this.accountService.updateAccount(newAccount.id, {
                                external_account_id: obpAccount.id,
                                bank_id: obpAccount.bank_id,
                                last_synced_at: new Date()
                            }, userId);
                        }
                        logger_1.default.info(`✅ Created new account: ${obpAccount.label}`);
                    }
                    result.synced++;
                    result.accounts.push({
                        obp_id: obpAccount.id,
                        name: obpAccount.label,
                        type: obpAccount.account_type,
                        balance: obpAccount.balance.amount,
                        currency: obpAccount.balance.currency
                    });
                }
                catch (error) {
                    logger_1.default.error(`❌ Failed to sync account ${obpAccount.label}:`, error);
                    result.errors.push(`Account "${obpAccount.label}": ${error.message}`);
                }
            }
            logger_1.default.info(`🎉 OBP account sync completed. Synced: ${result.synced}, Errors: ${result.errors.length}`);
            return result;
        }
        catch (error) {
            logger_1.default.error('❌ OBP account sync failed:', error);
            result.errors.push(`Sync failed: ${error.message}`);
            return result;
        }
    }
    /**
     * Sync transactions from OBP for a specific account
     */
    async syncTransactionsFromOBP(userId, accountId, limit = 50) {
        const result = { synced: 0, errors: [], transactions: [] };
        try {
            logger_1.default.info(`🔄 Starting OBP transaction sync for account ${accountId}`);
            // Get user's OBP token
            const tokens = await this.getTokensByUser(userId);
            const obpToken = tokens.find(t => t.provider === 'obp');
            if (!obpToken) {
                throw new NotFoundException_1.NotFoundException('No OBP bank token found for user');
            }
            // Get the account to sync
            const account = await this.accountService.getAccountById(accountId, userId);
            if (!account || account.user_id !== userId) {
                throw new NotFoundException_1.NotFoundException('Account not found or does not belong to user');
            }
            if (!account.external_account_id || !account.bank_id) {
                throw new Error('Account is not linked to OBP (missing external_account_id or bank_id)');
            }
            // Fetch transactions from OBP
            const obpTransactions = await this.obpService.fetchTransactions(account.external_account_id, account.bank_id, obpToken.access_token, obpToken.access_token_secret || '', limit);
            logger_1.default.info(`📥 Fetched ${obpTransactions.length} transactions from OBP for account ${account.account_name}`);
            // Process each transaction
            for (const obpTransaction of obpTransactions) {
                try {
                    // Check if transaction already exists
                    const existingTransactions = await this.transactionService.getTransactionsByUser(userId, 1, 1000);
                    const existingTransaction = existingTransactions.transactions.find(tx => tx.external_transaction_id === obpTransaction.id);
                    if (existingTransaction) {
                        logger_1.default.info(`⏭️  Transaction ${obpTransaction.id} already exists, skipping`);
                        continue;
                    }
                    // Create transaction
                    const transactionDto = {
                        account_id: accountId,
                        amount: Math.abs(parseFloat(obpTransaction.details.value.amount)),
                        transaction_date: new Date(obpTransaction.details.posted),
                        description: obpTransaction.details.description || 'OBP Transaction',
                        transaction_type: this.obpService.mapTransactionType(obpTransaction.details.value.amount),
                        merchant_name: this.obpService.extractMerchantName(obpTransaction),
                        category: this.categorizeTransaction(obpTransaction.details.description),
                        tags: ['imported', 'obp'],
                        is_recurring: false
                    };
                    const newTransaction = await this.transactionService.createTransaction(userId, transactionDto);
                    // Update with OBP-specific fields (this would require extending TransactionService)
                    logger_1.default.info(`✅ Created transaction: ${obpTransaction.details.description} (${obpTransaction.details.value.amount} ${obpTransaction.details.value.currency})`);
                    result.synced++;
                    result.transactions.push({
                        obp_id: obpTransaction.id,
                        description: obpTransaction.details.description,
                        amount: obpTransaction.details.value.amount,
                        currency: obpTransaction.details.value.currency,
                        date: obpTransaction.details.posted
                    });
                }
                catch (error) {
                    logger_1.default.error(`❌ Failed to sync transaction ${obpTransaction.id}:`, error);
                    result.errors.push(`Transaction "${obpTransaction.id}": ${error.message}`);
                }
            }
            // Update account sync timestamp
            await this.accountService.updateAccount(accountId, {
                last_synced_at: new Date()
            }, userId);
            logger_1.default.info(`🎉 OBP transaction sync completed. Synced: ${result.synced}, Errors: ${result.errors.length}`);
            return result;
        }
        catch (error) {
            logger_1.default.error('❌ OBP transaction sync failed:', error);
            result.errors.push(`Sync failed: ${error.message}`);
            return result;
        }
    }
    /**
     * Sync all data (accounts + transactions) from OBP
     */
    async syncAllDataFromOBP(userId, transactionLimit = 50) {
        try {
            logger_1.default.info(`🚀 Starting full OBP data sync for user ${userId}`);
            // First sync accounts
            const accountResult = await this.syncAccountsFromOBP(userId);
            // Then sync transactions for each account
            let totalTransactionsSynced = 0;
            const transactionErrors = [];
            const userAccountsResult = await this.accountService.getAllAccounts(userId);
            const obpAccounts = userAccountsResult.accounts.filter((acc) => acc.external_account_id);
            for (const account of obpAccounts) {
                try {
                    if (account.id) {
                        const txResult = await this.syncTransactionsFromOBP(userId, account.id, transactionLimit);
                        totalTransactionsSynced += txResult.synced;
                        transactionErrors.push(...txResult.errors);
                    }
                }
                catch (error) {
                    transactionErrors.push(`Account "${account.account_name}": ${error.message}`);
                }
            }
            logger_1.default.info(`🎉 Full OBP sync completed. Accounts: ${accountResult.synced}, Transactions: ${totalTransactionsSynced}`);
            return {
                accounts: { synced: accountResult.synced, errors: accountResult.errors },
                transactions: { synced: totalTransactionsSynced, errors: transactionErrors }
            };
        }
        catch (error) {
            logger_1.default.error('❌ Full OBP sync failed:', error);
            throw error;
        }
    }
    // === PRIVATE HELPER METHODS ===
    async updateAccountFromOBP(accountId, obpAccount, tokenId, userId) {
        await this.accountService.updateAccount(accountId, {
            account_name: obpAccount.label,
            balance: parseFloat(obpAccount.balance.amount),
            currency: obpAccount.balance.currency,
            bank_name: `OBP Demo Bank (${obpAccount.bank_id})`,
            external_account_id: obpAccount.id,
            bank_id: obpAccount.bank_id,
            last_synced_at: new Date()
        }, userId);
    }
    categorizeTransaction(description) {
        const desc = description.toLowerCase();
        // Simple categorization based on common patterns
        if (desc.includes('salary') || desc.includes('payroll'))
            return 'Income';
        if (desc.includes('grocery') || desc.includes('supermarket'))
            return 'Food & Dining';
        if (desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol'))
            return 'Transportation';
        if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('food'))
            return 'Food & Dining';
        if (desc.includes('pharmacy') || desc.includes('medical') || desc.includes('hospital'))
            return 'Healthcare';
        if (desc.includes('electric') || desc.includes('water') || desc.includes('gas bill'))
            return 'Bills & Utilities';
        if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('store'))
            return 'Shopping';
        return 'Other';
    }
}
exports.BankService = BankService;
//# sourceMappingURL=BankService.js.map