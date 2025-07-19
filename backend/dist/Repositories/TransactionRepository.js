"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
exports.createTransactionRepository = createTransactionRepository;
const client_1 = require("@prisma/client");
const ConnectionManager_1 = require("./ConnectionManager");
const TransactionModel_1 = require("../model/TransactionModel");
function toTransactionEntity(transaction) {
    return new TransactionModel_1.TransactionEntity(transaction.id, transaction.user_id, transaction.account_id, Number(transaction.amount), transaction.transaction_date, transaction.description, transaction.transaction_type, transaction.budget_id, transaction.group_budget_id, transaction.category, transaction.subcategory, transaction.merchant_name, transaction.location, transaction.is_recurring, transaction.tags, 
    // OBP Integration fields
    transaction.external_transaction_id || null, transaction.import_source || "manual", transaction.sync_status || "synced", transaction.created_at, transaction.updated_at, transaction.financial_accounts, transaction.user, transaction.budget, transaction.group_budget);
}
// Helper function to get TransactionEntity by ID
async function getTransactionEntityById(prisma, id) {
    const transaction = await prisma.transactions.findUnique({
        where: { id },
        include: {
            financial_accounts: true,
            users: true,
            budget: true,
            group_budget: true
        }
    });
    return transaction ? toTransactionEntity(transaction) : null;
}
class TransactionRepository {
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
        if (id <= 0)
            throw new Error('Invalid transaction ID');
        return id;
    }
    async create(transaction) {
        this.ensureConnected();
        // Validate required fields
        if (!transaction.user_id || !transaction.account_id || !transaction.amount || !transaction.description) {
            throw new Error('Missing required transaction fields');
        }
        const { id, created_at, updated_at, ...transactionData } = transaction;
        return this.prisma.transactions.create({
            data: {
                ...transactionData,
                amount: transactionData.amount,
                transaction_date: transactionData.transaction_date || new Date(),
                is_recurring: transactionData.is_recurring ?? false,
                tags: transactionData.tags || [],
            },
        });
    }
    async update(id, item) {
        this.ensureConnected();
        this.parseId(id);
        const existing = await this.prisma.transactions.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Transaction not found');
        const updated = await this.prisma.transactions.update({
            where: { id },
            data: {
                user_id: item.user_id,
                account_id: item.account_id,
                budget_id: item.budget_id,
                group_budget_id: item.group_budget_id,
                amount: item.amount,
                transaction_date: item.transaction_date,
                description: item.description,
                category: item.category,
                subcategory: item.subcategory,
                transaction_type: item.transaction_type,
                merchant_name: item.merchant_name,
                location: item.location,
                is_recurring: item.is_recurring,
                tags: item.tags,
                updated_at: new Date(),
            },
        });
        return updated;
    }
    async get(id) {
        this.ensureConnected();
        this.parseId(id);
        const transaction = await this.prisma.transactions.findUnique({
            where: { id },
            include: {
                financial_accounts: true,
                users: true,
                budget: true,
                group_budget: true
            }
        });
        if (!transaction)
            throw new Error('Transaction not found');
        return transaction;
    }
    async getAll() {
        this.ensureConnected();
        return this.prisma.transactions.findMany({
            orderBy: { transaction_date: 'desc' }
        });
    }
    async delete(id) {
        this.ensureConnected();
        this.parseId(id);
        const transaction = await this.prisma.transactions.findUnique({ where: { id } });
        if (!transaction)
            throw new Error('Transaction not found');
        await this.prisma.transactions.delete({ where: { id } });
    }
    // Extended methods for transaction-specific operations
    async getTransactionsByUser(userId, page = 1, limit = 50) {
        this.ensureConnected();
        const offset = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.transactions.findMany({
                where: { user_id: userId },
                include: {
                    financial_accounts: true,
                    budget: true,
                    group_budget: true
                },
                orderBy: { transaction_date: 'desc' },
                skip: offset,
                take: limit
            }),
            this.prisma.transactions.count({ where: { user_id: userId } })
        ]);
        return {
            transactions: transactions.map(toTransactionEntity),
            total
        };
    }
    async getTransactionsByAccount(accountId, page = 1, limit = 50) {
        this.ensureConnected();
        const offset = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.transactions.findMany({
                where: { account_id: accountId },
                include: {
                    financial_accounts: true,
                    budget: true,
                    group_budget: true
                },
                orderBy: { transaction_date: 'desc' },
                skip: offset,
                take: limit
            }),
            this.prisma.transactions.count({ where: { account_id: accountId } })
        ]);
        return {
            transactions: transactions.map(toTransactionEntity),
            total
        };
    }
    async searchTransactions(filters, page = 1, limit = 50) {
        this.ensureConnected();
        const offset = (page - 1) * limit;
        // Build where clause dynamically
        const whereClause = {};
        if (filters.user_id)
            whereClause.user_id = filters.user_id;
        if (filters.account_id)
            whereClause.account_id = filters.account_id;
        if (filters.category)
            whereClause.category = filters.category;
        if (filters.subcategory)
            whereClause.subcategory = filters.subcategory;
        if (filters.transaction_type)
            whereClause.transaction_type = filters.transaction_type;
        if (filters.merchant_name)
            whereClause.merchant_name = { contains: filters.merchant_name, mode: 'insensitive' };
        if (filters.is_recurring !== undefined)
            whereClause.is_recurring = filters.is_recurring;
        // Date range filter
        if (filters.date_from || filters.date_to) {
            whereClause.transaction_date = {};
            if (filters.date_from)
                whereClause.transaction_date.gte = filters.date_from;
            if (filters.date_to)
                whereClause.transaction_date.lte = filters.date_to;
        }
        // Amount range filter
        if (filters.amount_min || filters.amount_max) {
            whereClause.amount = {};
            if (filters.amount_min)
                whereClause.amount.gte = filters.amount_min;
            if (filters.amount_max)
                whereClause.amount.lte = filters.amount_max;
        }
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            whereClause.tags = { hasEvery: filters.tags };
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transactions.findMany({
                where: whereClause,
                include: {
                    financial_accounts: true,
                    budget: true,
                    group_budget: true
                },
                orderBy: { transaction_date: 'desc' },
                skip: offset,
                take: limit
            }),
            this.prisma.transactions.count({ where: whereClause })
        ]);
        return {
            transactions: transactions.map(toTransactionEntity),
            total
        };
    }
    async getTransactionsByCategory(userId, category, page = 1, limit = 50) {
        this.ensureConnected();
        const offset = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.transactions.findMany({
                where: {
                    user_id: userId,
                    category: category
                },
                include: {
                    financial_accounts: true,
                    budget: true,
                    group_budget: true
                },
                orderBy: { transaction_date: 'desc' },
                skip: offset,
                take: limit
            }),
            this.prisma.transactions.count({
                where: {
                    user_id: userId,
                    category: category
                }
            })
        ]);
        return {
            transactions: transactions.map(toTransactionEntity),
            total
        };
    }
    async getTransactionsByDateRange(userId, startDate, endDate, page = 1, limit = 50) {
        this.ensureConnected();
        const offset = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.transactions.findMany({
                where: {
                    user_id: userId,
                    transaction_date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    financial_accounts: true,
                    budget: true,
                    group_budget: true
                },
                orderBy: { transaction_date: 'desc' },
                skip: offset,
                take: limit
            }),
            this.prisma.transactions.count({
                where: {
                    user_id: userId,
                    transaction_date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            })
        ]);
        return {
            transactions: transactions.map(toTransactionEntity),
            total
        };
    }
    async getRecurringTransactions(userId) {
        this.ensureConnected();
        const transactions = await this.prisma.transactions.findMany({
            where: {
                user_id: userId,
                is_recurring: true
            },
            include: {
                financial_accounts: true,
                budget: true,
                group_budget: true
            },
            orderBy: { transaction_date: 'desc' }
        });
        return transactions.map(toTransactionEntity);
    }
    async getMonthlyTransactionSummary(userId, year, month) {
        this.ensureConnected();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const summary = await this.prisma.transactions.groupBy({
            by: ['transaction_type'],
            where: {
                user_id: userId,
                transaction_date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                amount: true
            },
            _count: true
        });
        return {
            month: month,
            year: year,
            summary: summary.map(s => ({
                type: s.transaction_type,
                total_amount: Number(s._sum.amount || 0),
                transaction_count: s._count
            }))
        };
    }
    async getCategorySpending(userId, startDate, endDate) {
        this.ensureConnected();
        const categorySpending = await this.prisma.transactions.groupBy({
            by: ['category'],
            where: {
                user_id: userId,
                transaction_type: client_1.transaction_type.expense,
                transaction_date: {
                    gte: startDate,
                    lte: endDate
                },
                category: {
                    not: null
                }
            },
            _sum: {
                amount: true
            },
            _count: true
        });
        return categorySpending.map(cs => ({
            category: cs.category,
            total_amount: Number(cs._sum.amount || 0),
            transaction_count: cs._count
        }));
    }
    async getTransactionById(id) {
        this.ensureConnected();
        const transaction = await this.prisma.transactions.findUnique({
            where: { id },
            include: {
                financial_accounts: true,
                users: true,
                budget: true,
                group_budget: true
            }
        });
        return transaction ? toTransactionEntity(transaction) : null;
    }
}
exports.TransactionRepository = TransactionRepository;
async function createTransactionRepository() {
    const repo = new TransactionRepository();
    await repo.init();
    return repo;
}
//# sourceMappingURL=TransactionRepository.js.map