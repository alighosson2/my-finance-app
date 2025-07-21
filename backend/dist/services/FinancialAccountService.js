"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountService = void 0;
const FinancialAccountRepository_1 = require("../Repositories/FinancialAccountRepository");
const ServiceException_1 = require("../exceptions/ServiceException");
class FinancialAccountService {
    constructor() {
        this.repository = null;
    }
    async getRepo() {
        if (!this.repository) {
            this.repository = await (0, FinancialAccountRepository_1.createFinancialAccountRepository)();
        }
        return this.repository;
    }
    async getAllAccounts(userId, page = 1, limit = 10) {
        try {
            const repository = await this.getRepo();
            const offset = (page - 1) * limit;
            const result = await repository.findByUserId(userId, page, limit);
            const { accounts, total } = result;
            return {
                accounts,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to get accounts: ${error.message}`);
        }
    }
    async getAccountById(id, userId) {
        try {
            const repository = await this.getRepo();
            const account = await repository.findById(id);
            if (!account) {
                throw new ServiceException_1.ServiceException('Account not found');
            }
            // Ensure user owns this account
            if (account.user_id !== userId) {
                throw new ServiceException_1.ServiceException('Access denied');
            }
            return account;
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to get account: ${error.message}`);
        }
    }
    async createAccount(data) {
        try {
            // Validate required fields
            if (!data.account_name || !data.account_type) {
                throw new ServiceException_1.ServiceException('Account name and type are required');
            }
            // Validate balance
            if (data.balance < 0) {
                throw new ServiceException_1.ServiceException('Balance cannot be negative');
            }
            const repository = await this.getRepo();
            return await repository.create(data);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to create account: ${error.message}`);
        }
    }
    async updateAccount(id, data, userId) {
        try {
            const repository = await this.getRepo();
            // Check if account exists and user owns it
            const existingAccount = await repository.findById(id);
            if (!existingAccount || existingAccount.user_id !== userId) {
                throw new ServiceException_1.ServiceException('Account not found or access denied');
            }
            // Validate balance if provided
            if (data.balance !== undefined && data.balance < 0) {
                throw new ServiceException_1.ServiceException('Balance cannot be negative');
            }
            const updatedAccount = await repository.update(id, data);
            if (!updatedAccount) {
                throw new ServiceException_1.ServiceException('Failed to update account');
            }
            return updatedAccount;
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to update account: ${error.message}`);
        }
    }
    async deleteAccount(id, userId) {
        try {
            const repository = await this.getRepo();
            // Check if account exists and user owns it
            const existingAccount = await repository.findById(id);
            if (!existingAccount || existingAccount.user_id !== userId) {
                throw new ServiceException_1.ServiceException('Account not found or access denied');
            }
            await repository.delete(id);
            return true;
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to delete account: ${error.message}`);
        }
    }
    async getAccountSummary(userId) {
        try {
            const repository = await this.getRepo();
            return await repository.getUserAccountSummary(userId);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to get account summary: ${error.message}`);
        }
    }
    // OBP-specific methods
    async findByExternalAccountId(externalAccountId) {
        try {
            const repository = await this.getRepo();
            return await repository.findByExternalAccountId(externalAccountId);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to find account by external ID: ${error.message}`);
        }
    }
    async updateSyncStatus(accountId, syncData) {
        try {
            const repository = await this.getRepo();
            await repository.updateSyncStatus(accountId, syncData);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to update sync status: ${error.message}`);
        }
    }
}
exports.FinancialAccountService = FinancialAccountService;
//# sourceMappingURL=FinancialAccountService.js.map