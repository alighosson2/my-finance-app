"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountRepository = void 0;
exports.createFinancialAccountRepository = createFinancialAccountRepository;
const ConnectionManager_1 = require("./ConnectionManager");
class FinancialAccountRepository {
    constructor() {
        this.prisma = null;
    }
    async init() {
        this.prisma = await ConnectionManager_1.ConnectionManager.getConnection();
    }
    ensureConnection() {
        if (!this.prisma) {
            throw new Error('Repository not initialized. Call init() first.');
        }
        return this.prisma;
    }
    async create(data) {
        const prisma = this.ensureConnection();
        const result = await prisma.financial_accounts.create({
            data: {
                ...data,
                created_at: new Date(),
                updated_at: new Date(),
                is_active: true,
            },
        });
        return result;
    }
    async findById(id) {
        const prisma = this.ensureConnection();
        return await prisma.financial_accounts.findUnique({
            where: { id },
        });
    }
    // Required by IRepository interface
    async get(id) {
        return this.findById(id);
    }
    async getAll() {
        const prisma = this.ensureConnection();
        return await prisma.financial_accounts.findMany();
    }
    async findMany(options) {
        const prisma = this.ensureConnection();
        return await prisma.financial_accounts.findMany(options || {});
    }
    async update(id, data) {
        const prisma = this.ensureConnection();
        return await prisma.financial_accounts.update({
            where: { id },
            data: {
                ...data,
                updated_at: new Date(),
            },
        });
    }
    async delete(id) {
        const prisma = this.ensureConnection();
        await prisma.financial_accounts.delete({
            where: { id },
        });
    }
    async count(where) {
        const prisma = this.ensureConnection();
        return await prisma.financial_accounts.count({ where: where || {} });
    }
    async findByUserId(userId, page = 1, limit = 10) {
        const prisma = this.ensureConnection();
        const [accounts, total] = await Promise.all([
            prisma.financial_accounts.findMany({
                where: { user_id: userId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            prisma.financial_accounts.count({
                where: { user_id: userId },
            }),
        ]);
        return { accounts, total };
    }
    async findByExternalAccountId(externalAccountId) {
        const prisma = this.ensureConnection();
        // Use raw query to avoid Prisma type issues with custom fields
        return await prisma.$queryRaw `
      SELECT * FROM financial_accounts 
      WHERE external_account_id = ${externalAccountId} 
      LIMIT 1
    `;
    }
    async updateSyncStatus(accountId, syncData) {
        const prisma = this.ensureConnection();
        // Use raw query for custom fields
        await prisma.$executeRaw `
      UPDATE financial_accounts 
      SET last_synced_at = ${syncData.last_synced_at}, updated_at = NOW()
      WHERE id = ${accountId}
    `;
    }
    async getUserAccountSummary(userId) {
        const prisma = this.ensureConnection();
        const accounts = await prisma.financial_accounts.findMany({
            where: { user_id: userId, is_active: true },
        });
        return {
            total_accounts: accounts.length,
            total_balance: accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance?.toString() || '0') || 0), 0),
            accounts_by_type: accounts.reduce((acc, account) => {
                const type = account.account_type;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {}),
        };
    }
}
exports.FinancialAccountRepository = FinancialAccountRepository;
// Factory function to create and initialize the repository
async function createFinancialAccountRepository() {
    const repository = new FinancialAccountRepository();
    await repository.init();
    return repository;
}
//# sourceMappingURL=FinancialAccountRepository.js.map