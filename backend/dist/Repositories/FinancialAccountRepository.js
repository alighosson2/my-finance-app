"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountRepository = void 0;
exports.createFinancialAccountRepository = createFinancialAccountRepository;
const library_1 = require("@prisma/client/runtime/library");
const ConnectionManager_1 = require("./ConnectionManager");
const FinancialAccountModel_1 = require("../model/FinancialAccountModel");
function toFinancialAccountEntity(account) {
    return new FinancialAccountModel_1.FinancialAccountEntity(account.id, account.user_id, account.bank_token_id, account.account_name, account.account_type, Number(account.balance), account.currency, account.bank_name, account.account_number_masked, 
    // OBP Integration fields
    account.external_account_id || null, account.bank_id || null, account.last_synced_at || null, account.is_active ?? true, account.created_at ?? new Date(), account.updated_at ?? new Date());
}
class FinancialAccountRepository {
    constructor() {
        this.prisma = null;
    }
    async init() {
        this.prisma = await ConnectionManager_1.ConnectionManager.getConnection();
    }
    ensureConnected() {
        if (!this.prisma)
            throw new Error('Database not initialized');
    }
    parseId(id) {
        if (id <= 0) {
            throw new Error('Invalid account ID');
        }
        return id;
    }
    async create(account) {
        this.ensureConnected();
        // Validate required fields
        if (!account.user_id || account.user_id <= 0) {
            throw new Error('Valid user_id is required');
        }
        if (!account.account_name || account.account_name.trim() === '') {
            throw new Error('Account name is required');
        }
        if (!account.account_type || account.account_type.toString().trim() === '') {
            throw new Error('Account type is required');
        }
        // Create the account without the id field (auto-generated)
        const createData = {
            user_id: account.user_id,
            bank_token_id: account.bank_token_id,
            account_name: account.account_name,
            account_type: account.account_type,
            balance: new library_1.Decimal(Number(account.balance) || 0),
            currency: account.currency || 'USD',
            bank_name: account.bank_name,
            account_number_masked: account.account_number_masked,
            is_active: account.is_active ?? true,
            created_at: account.created_at || new Date(),
            updated_at: account.updated_at || new Date()
        };
        const result = await this.prisma.financial_accounts.create({
            data: createData
        });
        return result;
    }
    async update(id, account) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const existing = await this.prisma.financial_accounts.findUnique({
                where: { id },
            });
            if (!existing) {
                return null;
            }
            const updateData = {
                bank_token_id: account.bank_token_id,
                account_name: account.account_name,
                account_type: account.account_type,
                balance: new library_1.Decimal(Number(account.balance)),
                currency: account.currency,
                bank_name: account.bank_name,
                account_number_masked: account.account_number_masked,
                is_active: account.is_active,
                updated_at: new Date()
            };
            return this.prisma.financial_accounts.update({
                where: { id },
                data: updateData
            });
        }
        catch (error) {
            throw new Error(`Failed to update account: ${error.message}`);
        }
    }
    async get(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const account = await this.prisma.financial_accounts.findUnique({
                where: { id },
            });
            if (!account) {
                throw new Error('Account not found');
            }
            return account;
        }
        catch (error) {
            if (error.message === 'Account not found') {
                throw error;
            }
            throw new Error(`Failed to get account: ${error.message}`);
        }
    }
    async getAll() {
        this.ensureConnected();
        return this.prisma.financial_accounts.findMany();
    }
    async delete(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const existing = await this.prisma.financial_accounts.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('Account not found');
            }
            await this.prisma.financial_accounts.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error.message === 'Account not found') {
                throw error;
            }
            throw new Error(`Failed to delete account: ${error.message}`);
        }
    }
    // Financial Account-specific methods
    async getAccountsByUser(userId) {
        this.ensureConnected();
        if (userId <= 0) {
            throw new Error('Invalid user ID');
        }
        try {
            const accounts = await this.prisma.financial_accounts.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });
            return accounts.map(toFinancialAccountEntity);
        }
        catch (error) {
            throw new Error(`Failed to get accounts: ${error.message}`);
        }
    }
    async getAccountById(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const account = await this.prisma.financial_accounts.findUnique({
                where: { id },
            });
            return account ? toFinancialAccountEntity(account) : null;
        }
        catch (error) {
            throw new Error(`Failed to get account: ${error.message}`);
        }
    }
    async getActiveAccountsByUser(userId) {
        this.ensureConnected();
        if (userId <= 0) {
            throw new Error('Invalid user ID');
        }
        try {
            const accounts = await this.prisma.financial_accounts.findMany({
                where: {
                    user_id: userId,
                    is_active: true
                },
                orderBy: { created_at: 'desc' }
            });
            return accounts.map(toFinancialAccountEntity);
        }
        catch (error) {
            throw new Error(`Failed to get active accounts: ${error.message}`);
        }
    }
    async getAccountSummaryByUser(userId) {
        this.ensureConnected();
        if (userId <= 0) {
            throw new Error('Invalid user ID');
        }
        try {
            const accounts = await this.prisma.financial_accounts.findMany({
                where: { user_id: userId }
            });
            const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
            const accountsByType = accounts.reduce((acc, account) => {
                acc[account.account_type] = (acc[account.account_type] || 0) + 1;
                return acc;
            }, {});
            const currencyBreakdown = accounts.reduce((acc, account) => {
                acc[account.currency] = (acc[account.currency] || 0) + Number(account.balance);
                return acc;
            }, {});
            return {
                total_balance: totalBalance,
                accounts_by_type: accountsByType,
                currency_breakdown: currencyBreakdown,
                active_accounts: accounts.filter(a => a.is_active).length,
                total_accounts: accounts.length
            };
        }
        catch (error) {
            throw new Error(`Failed to get account summary: ${error.message}`);
        }
    }
    async updateBalance(id, balance) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const existing = await this.prisma.financial_accounts.findUnique({
                where: { id },
            });
            if (!existing) {
                return null;
            }
            const updated = await this.prisma.financial_accounts.update({
                where: { id },
                data: {
                    balance: new library_1.Decimal(balance),
                    updated_at: new Date()
                }
            });
            return toFinancialAccountEntity(updated);
        }
        catch (error) {
            throw new Error(`Failed to update balance: ${error.message}`);
        }
    }
}
exports.FinancialAccountRepository = FinancialAccountRepository;
async function createFinancialAccountRepository() {
    const repo = new FinancialAccountRepository();
    await repo.init();
    return repo;
}
//# sourceMappingURL=FinancialAccountRepository.js.map