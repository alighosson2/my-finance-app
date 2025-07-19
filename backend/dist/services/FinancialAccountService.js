"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountService = void 0;
const FinancialAccountRepository_1 = require("../Repositories/FinancialAccountRepository");
const NotFoundException_1 = require("../exceptions/NotFoundException");
const BadRequestException_1 = require("../exceptions/BadRequestException");
const ServiceException_1 = require("../exceptions/ServiceException");
const library_1 = require("@prisma/client/runtime/library");
const BankService_1 = require("./BankService");
class FinancialAccountService {
    constructor() {
        this.accountRepository = null;
        this.bankService = null;
    }
    async getRepo() {
        if (!this.accountRepository) {
            this.accountRepository = new FinancialAccountRepository_1.FinancialAccountRepository();
            await this.accountRepository.init();
        }
        return this.accountRepository;
    }
    async getBankService() {
        if (!this.bankService) {
            this.bankService = new BankService_1.BankService();
        }
        return this.bankService;
    }
    // Helper method to validate and convert account type
    validateAccountType(accountType) {
        const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'loan', 'other'];
        if (!validTypes.includes(accountType)) {
            throw new BadRequestException_1.BadRequestException(`Invalid account type. Must be one of: ${validTypes.join(', ')}`);
        }
        return accountType;
    }
    async createAccount(dto) {
        const repo = await this.getRepo();
        // Validate user_id is provided
        if (!dto.user_id || dto.user_id <= 0) {
            throw new BadRequestException_1.BadRequestException('Valid user_id is required');
        }
        // Validate account name
        if (!dto.account_name || dto.account_name.trim() === '') {
            throw new BadRequestException_1.BadRequestException('Account name is required');
        }
        // Validate and convert account type
        const accountType = this.validateAccountType(dto.account_type);
        // Validate currency
        if (dto.currency && !/^[A-Z]{3}$/.test(dto.currency)) {
            throw new BadRequestException_1.BadRequestException('Currency must be a 3-letter ISO code (e.g., USD, EUR)');
        }
        try {
            const accountData = {
                id: 0, // This will be ignored by the repository
                user_id: dto.user_id,
                bank_token_id: dto.bank_token_id ?? null,
                account_name: dto.account_name,
                account_type: accountType, // Use the validated enum value
                balance: new library_1.Decimal(dto.balance || 0),
                currency: dto.currency || 'USD',
                bank_name: dto.bank_name ?? null,
                account_number_masked: dto.account_number_masked ?? null,
                is_active: dto.is_active ?? true,
                created_at: new Date(),
                updated_at: new Date()
            };
            const account = await repo.create(accountData);
            const result = await repo.getAccountById(account.id);
            if (!result) {
                throw new ServiceException_1.ServiceException('Failed to retrieve created account');
            }
            return result;
        }
        catch (error) {
            if (error instanceof BadRequestException_1.BadRequestException)
                throw error;
            throw new ServiceException_1.ServiceException(`Failed to create account: ${error.message}`);
        }
    }
    async getAccountById(id) {
        const repo = await this.getRepo();
        const account = await repo.getAccountById(id);
        if (!account) {
            throw new NotFoundException_1.NotFoundException('Financial account not found');
        }
        return account;
    }
    async getAccountsByUser(userId) {
        if (!userId || userId <= 0) {
            throw new BadRequestException_1.BadRequestException('Valid user ID is required');
        }
        return (await this.getRepo()).getAccountsByUser(userId);
    }
    async getActiveAccountsByUser(userId) {
        if (!userId || userId <= 0) {
            throw new BadRequestException_1.BadRequestException('Valid user ID is required');
        }
        return (await this.getRepo()).getActiveAccountsByUser(userId);
    }
    async updateAccount(id, dto) {
        const repo = await this.getRepo();
        const existing = await repo.getAccountById(id);
        if (!existing) {
            throw new NotFoundException_1.NotFoundException('Account not found');
        }
        // Validate and convert account type if provided
        let accountType;
        if (dto.account_type) {
            accountType = this.validateAccountType(dto.account_type);
        }
        // Validate currency if provided
        if (dto.currency && !/^[A-Z]{3}$/.test(dto.currency)) {
            throw new BadRequestException_1.BadRequestException('Currency must be a 3-letter ISO code (e.g., USD, EUR)');
        }
        try {
            const updated = await repo.update(id, {
                id: existing.id,
                user_id: existing.user_id,
                bank_token_id: dto.bank_token_id !== undefined ? dto.bank_token_id : existing.bank_token_id,
                account_name: dto.account_name ?? existing.account_name,
                account_type: accountType ?? existing.account_type,
                balance: dto.balance !== undefined ? new library_1.Decimal(dto.balance) : new library_1.Decimal(existing.balance),
                currency: dto.currency ?? existing.currency,
                bank_name: dto.bank_name !== undefined ? dto.bank_name : existing.bank_name,
                account_number_masked: dto.account_number_masked !== undefined ? dto.account_number_masked : existing.account_number_masked,
                is_active: dto.is_active !== undefined ? dto.is_active : existing.is_active,
                created_at: existing.created_at,
                updated_at: new Date()
            });
            if (!updated) {
                throw new ServiceException_1.ServiceException('Failed to update account');
            }
            const result = await repo.getAccountById(id);
            if (!result) {
                throw new ServiceException_1.ServiceException('Failed to retrieve updated account');
            }
            return result;
        }
        catch (error) {
            if (error instanceof NotFoundException_1.NotFoundException || error instanceof BadRequestException_1.BadRequestException)
                throw error;
            throw new ServiceException_1.ServiceException(`Failed to update account: ${error.message}`);
        }
    }
    async deleteAccount(id) {
        const repo = await this.getRepo();
        const account = await repo.getAccountById(id);
        if (!account) {
            throw new NotFoundException_1.NotFoundException('Account not found');
        }
        try {
            await repo.delete(id);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to delete account: ${error.message}`);
        }
    }
    async updateBalance(id, dto) {
        const repo = await this.getRepo();
        // Validate balance
        if (dto.balance === undefined || dto.balance === null) {
            throw new BadRequestException_1.BadRequestException('Balance is required');
        }
        if (typeof dto.balance !== 'number' || isNaN(dto.balance)) {
            throw new BadRequestException_1.BadRequestException('Balance must be a valid number');
        }
        const account = await repo.getAccountById(id);
        if (!account) {
            throw new NotFoundException_1.NotFoundException('Account not found');
        }
        try {
            const updated = await repo.updateBalance(id, dto.balance);
            if (!updated) {
                throw new ServiceException_1.ServiceException('Failed to update balance');
            }
            return updated;
        }
        catch (error) {
            if (error instanceof NotFoundException_1.NotFoundException)
                throw error;
            throw new ServiceException_1.ServiceException(`Failed to update balance: ${error.message}`);
        }
    }
    async getAccountSummary(userId) {
        if (!userId || userId <= 0) {
            throw new BadRequestException_1.BadRequestException('Valid user ID is required');
        }
        const repo = await this.getRepo();
        try {
            return await repo.getAccountSummaryByUser(userId);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException(`Failed to get account summary: ${error.message}`);
        }
    }
    // Helper method to verify account ownership
    async verifyAccountOwnership(accountId, userId) {
        const account = await this.getAccountById(accountId);
        if (account.user_id !== userId) {
            throw new NotFoundException_1.NotFoundException('Account not found');
        }
        return account;
    }
    // Method to deactivate all accounts for a user (useful for account cleanup)
    async deactivateUserAccounts(userId) {
        const accounts = await this.getAccountsByUser(userId);
        const repo = await this.getRepo();
        for (const account of accounts) {
            await repo.update(account.id, {
                id: account.id,
                user_id: account.user_id,
                bank_token_id: account.bank_token_id,
                account_name: account.account_name,
                account_type: account.account_type,
                balance: new library_1.Decimal(account.balance),
                currency: account.currency,
                bank_name: account.bank_name,
                account_number_masked: account.account_number_masked,
                is_active: false,
                created_at: account.created_at,
                updated_at: new Date()
            });
        }
    }
    // NEW: Create account linked to a specific bank
    async createBankLinkedAccount(userId, bankTokenId, dto) {
        const bankService = await this.getBankService();
        // Verify the bank token belongs to the user
        const bankToken = await bankService.getTokenById(bankTokenId);
        if (bankToken.user_id !== userId) {
            throw new BadRequestException_1.BadRequestException('Bank token does not belong to user');
        }
        // Remove bank_token_id from dto if it exists (it shouldn't but just in case)
        const { bank_token_id, ...cleanDto } = dto;
        const finalDto = {
            ...cleanDto,
            user_id: userId,
            bank_token_id: bankTokenId,
            bank_name: cleanDto.bank_name ?? bankToken.provider
        };
        // Create account linked to the bank
        return await this.createAccount(finalDto);
    }
    // NEW: Get all accounts linked to a specific bank
    async getAccountsByBank(userId, bankTokenId) {
        const accounts = await this.getAccountsByUser(userId);
        return accounts.filter(account => account.bank_token_id === bankTokenId);
    }
    // NEW: Get all manual (non-bank) accounts
    async getManualAccounts(userId) {
        const accounts = await this.getAccountsByUser(userId);
        return accounts.filter(account => !account.bank_token_id);
    }
    // NEW: Link existing account to a bank
    async linkAccountToBank(userId, accountId, bankTokenId) {
        const bankService = await this.getBankService();
        // Verify ownership
        const account = await this.verifyAccountOwnership(accountId, userId);
        // Verify bank token belongs to user
        const bankToken = await bankService.getTokenById(bankTokenId);
        if (bankToken.user_id !== userId) {
            throw new BadRequestException_1.BadRequestException('Bank token does not belong to user');
        }
        // Update account to link to bank
        return await this.updateAccount(accountId, {
            bank_token_id: bankTokenId,
            bank_name: bankToken.provider
        });
    }
    // NEW: Unlink account from bank (make it manual)
    async unlinkAccountFromBank(userId, accountId) {
        // Verify ownership
        await this.verifyAccountOwnership(accountId, userId);
        // Update account to remove bank link
        return await this.updateAccount(accountId, {
            bank_token_id: null,
            bank_name: null
        });
    }
}
exports.FinancialAccountService = FinancialAccountService;
//# sourceMappingURL=FinancialAccountService.js.map