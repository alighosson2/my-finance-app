import { PrismaClient, transactions, transaction_type } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { id, ITransactionRepository } from './IRepository';
import logger from '../util/logger';
import { TransactionEntity, TransactionSearchFilters } from '../model/TransactionModel';

function toTransactionEntity(transaction: transactions & {
  financial_accounts?: any;
  user?: any;
  budget?: any;
  group_budget?: any;
}): TransactionEntity {
  return new TransactionEntity(
    transaction.id,
    transaction.user_id,
    transaction.account_id,
    Number(transaction.amount),
    transaction.transaction_date,
    transaction.description,
    transaction.transaction_type,
    transaction.budget_id,
    transaction.group_budget_id,
    transaction.category,
    transaction.subcategory,
    transaction.merchant_name,
    transaction.location,
    transaction.is_recurring,
    transaction.tags,
    transaction.created_at,
    transaction.updated_at,
    transaction.financial_accounts,
    transaction.user,
    transaction.budget,
    transaction.group_budget
  );
}

// Helper function to get TransactionEntity by ID
async function getTransactionEntityById(prisma: PrismaClient, id: number): Promise<TransactionEntity | null> {
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

export class TransactionRepository implements ITransactionRepository {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    this.prisma = await ConnectionManager.getConnection();
  }

  private ensureConnected(): void {
    if (!this.prisma) throw new Error('Database not initialized');
  }

  private parseId(id: id): number {
    if (id <= 0) throw new Error('Invalid transaction ID');
    return id;
  }

  async create(transaction: transactions): Promise<transactions> {
    this.ensureConnected();
    
    // Validate required fields
    if (!transaction.user_id || !transaction.account_id || !transaction.amount || !transaction.description) {
      throw new Error('Missing required transaction fields');
    }

    const { id, created_at, updated_at, ...transactionData } = transaction;
    
    return this.prisma!.transactions.create({
      data: {
        ...transactionData,
        amount: transactionData.amount,
        transaction_date: transactionData.transaction_date || new Date(),
        is_recurring: transactionData.is_recurring ?? false,
        tags: transactionData.tags || [],
      },
    });
  }

  async update(id: id, item: transactions): Promise<transactions | null> {
    this.ensureConnected();
    this.parseId(id);

    const existing = await this.prisma!.transactions.findUnique({ where: { id } });
    if (!existing) throw new Error('Transaction not found');

    const updated = await this.prisma!.transactions.update({
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

  async get(id: id): Promise<transactions> {
    this.ensureConnected();
    this.parseId(id);
    
    const transaction = await this.prisma!.transactions.findUnique({ 
      where: { id },
      include: {
        financial_accounts: true,
        users: true,
        budget: true,
        group_budget: true
      }
    });
    
    if (!transaction) throw new Error('Transaction not found');
    return transaction;
  }

  async getAll(): Promise<transactions[]> {
    this.ensureConnected();
    return this.prisma!.transactions.findMany({
      orderBy: { transaction_date: 'desc' }
    });
  }

  async delete(id: id): Promise<void> {
    this.ensureConnected();
    this.parseId(id);
    
    const transaction = await this.prisma!.transactions.findUnique({ where: { id } });
    if (!transaction) throw new Error('Transaction not found');
    
    await this.prisma!.transactions.delete({ where: { id } });
  }

  // Extended methods for transaction-specific operations
  async getTransactionsByUser(userId: number, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number }> {
    this.ensureConnected();
    
    const offset = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.prisma!.transactions.findMany({
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
      this.prisma!.transactions.count({ where: { user_id: userId } })
    ]);

    return {
      transactions: transactions.map(toTransactionEntity),
      total
    };
  }

  async getTransactionsByAccount(accountId: number, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number }> {
    this.ensureConnected();
    
    const offset = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.prisma!.transactions.findMany({
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
      this.prisma!.transactions.count({ where: { account_id: accountId } })
    ]);

    return {
      transactions: transactions.map(toTransactionEntity),
      total
    };
  }

  async searchTransactions(filters: TransactionSearchFilters, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number }> {
    this.ensureConnected();
    
    const offset = (page - 1) * limit;
    
    // Build where clause dynamically
    const whereClause: any = {};
    
    if (filters.user_id) whereClause.user_id = filters.user_id;
    if (filters.account_id) whereClause.account_id = filters.account_id;
    if (filters.category) whereClause.category = filters.category;
    if (filters.subcategory) whereClause.subcategory = filters.subcategory;
    if (filters.transaction_type) whereClause.transaction_type = filters.transaction_type;
    if (filters.merchant_name) whereClause.merchant_name = { contains: filters.merchant_name, mode: 'insensitive' };
    if (filters.is_recurring !== undefined) whereClause.is_recurring = filters.is_recurring;
    
    // Date range filter
    if (filters.date_from || filters.date_to) {
      whereClause.transaction_date = {};
      if (filters.date_from) whereClause.transaction_date.gte = filters.date_from;
      if (filters.date_to) whereClause.transaction_date.lte = filters.date_to;
    }
    
    // Amount range filter
    if (filters.amount_min || filters.amount_max) {
      whereClause.amount = {};
      if (filters.amount_min) whereClause.amount.gte = filters.amount_min;
      if (filters.amount_max) whereClause.amount.lte = filters.amount_max;
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = { hasEvery: filters.tags };
    }

    const [transactions, total] = await Promise.all([
      this.prisma!.transactions.findMany({
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
      this.prisma!.transactions.count({ where: whereClause })
    ]);

    return {
      transactions: transactions.map(toTransactionEntity),
      total
    };
  }

  async getTransactionsByCategory(userId: number, category: string, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number }> {
    this.ensureConnected();
    
    const offset = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.prisma!.transactions.findMany({
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
      this.prisma!.transactions.count({ 
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

  async getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number }> {
    this.ensureConnected();
    
    const offset = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.prisma!.transactions.findMany({
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
      this.prisma!.transactions.count({
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

  async getRecurringTransactions(userId: number): Promise<TransactionEntity[]> {
    this.ensureConnected();
    
    const transactions = await this.prisma!.transactions.findMany({
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

  async getMonthlyTransactionSummary(userId: number, year: number, month: number): Promise<any> {
    this.ensureConnected();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const summary = await this.prisma!.transactions.groupBy({
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

  async getCategorySpending(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    this.ensureConnected();
    
    const categorySpending = await this.prisma!.transactions.groupBy({
      by: ['category'],
      where: {
        user_id: userId,
        transaction_type: transaction_type.expense,
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

  async getTransactionById(id: number): Promise<TransactionEntity | null> {
    this.ensureConnected();
    
    const transaction = await this.prisma!.transactions.findUnique({
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

export async function createTransactionRepository(): Promise<ITransactionRepository> {
  const repo = new TransactionRepository();
  await repo.init();
  return repo;
} 