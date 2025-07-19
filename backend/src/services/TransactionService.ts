import { transactions, transaction_type } from '@prisma/client';
import { createTransactionRepository } from '../Repositories/TransactionRepository';
import { id, ITransactionRepository } from '../Repositories/IRepository';
import logger from '../util/logger';
import { NotFoundException } from '../exceptions/NotFoundException';
import { BadRequestException } from '../exceptions/BadRequestException';
import { TransactionEntity, CreateTransactionRequest, UpdateTransactionRequest, TransactionSearchFilters, TransactionHelpers } from '../model/TransactionModel';

export class TransactionService {
  private transactionRepository: ITransactionRepository | null = null;

  private async getRepo(): Promise<ITransactionRepository> {
    if (!this.transactionRepository) {
      this.transactionRepository = await createTransactionRepository();
    }
    return this.transactionRepository;
  }

  async getAllTransactions(): Promise<transactions[]> {
    return (await this.getRepo()).getAll();
  }

  async getTransactionById(transactionId: id): Promise<TransactionEntity> {
    const repo = await this.getRepo();
    const transaction = await repo.getTransactionById(transactionId);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getTransactionsByUser(userId: number, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number; totalPages: number }> {
    const repo = await this.getRepo();
    const result = await repo.getTransactionsByUser(userId, page, limit);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async getTransactionsByAccount(accountId: number, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number; totalPages: number }> {
    const repo = await this.getRepo();
    const result = await repo.getTransactionsByAccount(accountId, page, limit);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async createTransaction(userId: number, data: CreateTransactionRequest): Promise<TransactionEntity> {
    // Validate required fields
    this.validateTransactionData(data);

    // Auto-categorize if no category provided
    if (!data.category) {
      const autoCategory = TransactionHelpers.categorizeByDescription(data.description);
      data.category = autoCategory.category || undefined;
      data.subcategory = autoCategory.subcategory || undefined;
    }

    // Clean and normalize tags
    const cleanTags = this.normalizeTags(data.tags);

    const transaction: transactions = {
      id: 0,
      user_id: userId,
      account_id: data.account_id,
      budget_id: data.budget_id || null,
      group_budget_id: data.group_budget_id || null,
      amount: data.amount as any,
      transaction_date: data.transaction_date || new Date(),
      description: data.description.trim(),
      category: data.category || null,
      subcategory: data.subcategory || null,
      transaction_type: data.transaction_type,
      merchant_name: data.merchant_name?.trim() || null,
      location: data.location?.trim() || null,
      is_recurring: data.is_recurring || false,
      tags: cleanTags,
      created_at: null,
      updated_at: null,
    };

    const created = await (await this.getRepo()).create(transaction);
    return this.getTransactionById(created.id);
  }

  async updateTransaction(transactionId: id, userId: number, data: UpdateTransactionRequest): Promise<TransactionEntity> {
    const repo = await this.getRepo();
    const existing = await repo.getTransactionById(transactionId);
    
    if (!existing) throw new NotFoundException('Transaction not found');
    
    // Verify ownership
    if (existing.user_id !== userId) {
      throw new BadRequestException('Unauthorized to update this transaction');
    }

    // Validate updated data if provided
    if (data.amount !== undefined && !TransactionHelpers.isValidAmount(data.amount)) {
      throw new BadRequestException('Invalid transaction amount');
    }
    
    if (data.transaction_type && !TransactionHelpers.isValidType(data.transaction_type)) {
      throw new BadRequestException('Invalid transaction type');
    }

    // Clean and normalize tags if provided
    const cleanTags = data.tags ? this.normalizeTags(data.tags) : existing.tags;

    // Create a transactions object for Prisma update
    const transactionData: any = {
      id: existing.id,
      user_id: existing.user_id,
      account_id: data.account_id ?? existing.account_id,
      amount: data.amount ?? existing.amount,
      transaction_date: data.transaction_date ?? existing.transaction_date,
      description: data.description?.trim() ?? existing.description,
      transaction_type: data.transaction_type ?? existing.transaction_type,
      budget_id: data.budget_id !== undefined ? data.budget_id : existing.budget_id,
      group_budget_id: data.group_budget_id !== undefined ? data.group_budget_id : existing.group_budget_id,
      category: data.category !== undefined ? data.category : existing.category,
      subcategory: data.subcategory !== undefined ? data.subcategory : existing.subcategory,
      merchant_name: data.merchant_name !== undefined ? data.merchant_name?.trim() || null : existing.merchant_name,
      location: data.location !== undefined ? data.location?.trim() || null : existing.location,
      is_recurring: data.is_recurring !== undefined ? data.is_recurring : existing.is_recurring,
      tags: cleanTags,
      created_at: existing.created_at,
      updated_at: new Date(),
    };

    const updated = await repo.update(transactionId, transactionData);
    if (!updated) throw new Error(`Transaction with id ${transactionId} could not be updated`);
    
    // Convert back to TransactionEntity
    return new TransactionEntity(
      updated.id,
      updated.user_id,
      updated.account_id,
      Number(updated.amount),
      updated.transaction_date,
      updated.description,
      updated.transaction_type,
      updated.budget_id,
      updated.group_budget_id,
      updated.category,
      updated.subcategory,
      updated.merchant_name,
      updated.location,
      updated.is_recurring,
      updated.tags,
      updated.created_at,
      updated.updated_at
    );
  }

  async deleteTransaction(transactionId: id, userId: number): Promise<void> {
    const repo = await this.getRepo();
    const existing = await repo.getTransactionById(transactionId);
    
    if (!existing) throw new NotFoundException('Transaction not found');
    
    // Verify ownership
    if (existing.user_id !== userId) {
      throw new BadRequestException('Unauthorized to delete this transaction');
    }

    await repo.delete(transactionId);
  }

  async searchTransactions(userId: number, filters: TransactionSearchFilters, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number; totalPages: number }> {
    const repo = await this.getRepo();
    
    // Ensure user can only search their own transactions
    filters.user_id = userId;
    
    const result = await repo.searchTransactions(filters, page, limit);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async getTransactionsByCategory(userId: number, category: string, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number; totalPages: number }> {
    const repo = await this.getRepo();
    const result = await repo.getTransactionsByCategory(userId, category, page, limit);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date, page: number = 1, limit: number = 50): Promise<{ transactions: TransactionEntity[]; total: number; totalPages: number }> {
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const repo = await this.getRepo();
    const result = await repo.getTransactionsByDateRange(userId, startDate, endDate, page, limit);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async getRecurringTransactions(userId: number): Promise<TransactionEntity[]> {
    return (await this.getRepo()).getRecurringTransactions(userId);
  }

  async getMonthlyTransactionSummary(userId: number, year: number, month: number): Promise<any> {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Invalid month. Must be between 1 and 12');
    }

    if (year < 1900 || year > new Date().getFullYear() + 1) {
      throw new BadRequestException('Invalid year');
    }

    return (await this.getRepo()).getMonthlyTransactionSummary(userId, year, month);
  }

  async getCategorySpending(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    return (await this.getRepo()).getCategorySpending(userId, startDate, endDate);
  }

  async getDashboardSummary(userId: number): Promise<any> {
    const repo = await this.getRepo();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Get current month data
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);
    
    const [monthlyTransactions, categorySummary, recentTransactions] = await Promise.all([
      repo.getMonthlyTransactionSummary(userId, currentYear, currentMonth),
      repo.getCategorySpending(userId, startOfMonth, endOfMonth),
      repo.getTransactionsByUser(userId, 1, 10)
    ]);

    return {
      monthly_summary: monthlyTransactions,
      category_breakdown: categorySummary,
      recent_transactions: recentTransactions.transactions,
      summary_period: {
        month: currentMonth,
        year: currentYear,
        start_date: startOfMonth,
        end_date: endOfMonth
      }
    };
  }

  // Helper methods for business logic
  private validateTransactionData(data: CreateTransactionRequest): void {
    if (!data.account_id || data.account_id <= 0) {
      throw new BadRequestException('Valid account ID is required');
    }

    if (!TransactionHelpers.isValidAmount(data.amount)) {
      throw new BadRequestException('Transaction amount must be positive');
    }

    if (!data.description?.trim()) {
      throw new BadRequestException('Transaction description is required');
    }

    if (!TransactionHelpers.isValidType(data.transaction_type)) {
      throw new BadRequestException('Invalid transaction type');
    }

    // Validate date is not in future (for expenses/income)
    if (data.transaction_date && data.transaction_date > new Date() && data.transaction_type !== transaction_type.transfer) {
      throw new BadRequestException('Transaction date cannot be in the future');
    }
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 tags
  }

  // Utility method for bulk operations
  async bulkCreateTransactions(userId: number, transactions: CreateTransactionRequest[]): Promise<TransactionEntity[]> {
    const results: TransactionEntity[] = [];
    
    for (const transactionData of transactions) {
      try {
        const created = await this.createTransaction(userId, transactionData);
        results.push(created);
      } catch (error) {
        logger.error(`Failed to create transaction: ${transactionData.description}`, error);
        // Continue with other transactions
      }
    }
    
    return results;
  }

  // Recurring transaction handling
  async processRecurringTransactions(userId: number): Promise<TransactionEntity[]> {
    const recurringTransactions = await this.getRecurringTransactions(userId);
    const newTransactions: TransactionEntity[] = [];
    
    for (const recurring of recurringTransactions) {
      // Simple logic: if last transaction was more than 30 days ago, create a new one
      const daysSinceLastTransaction = Math.floor(
        (new Date().getTime() - recurring.transaction_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastTransaction >= 30) {
        try {
          const newTransaction = await this.createTransaction(userId, {
            account_id: recurring.account_id,
            amount: recurring.amount,
            transaction_date: new Date(),
            description: `${recurring.description} (Auto-recurring)`,
            category: recurring.category || null,
            subcategory: recurring.subcategory || null,
            transaction_type: recurring.transaction_type,
            merchant_name: recurring.merchant_name || null,
            location: recurring.location || null,
            is_recurring: true,
            tags: recurring.tags,
            budget_id: recurring.budget_id || null,
            group_budget_id: recurring.group_budget_id || null
          });
          
          newTransactions.push(newTransaction);
        } catch (error) {
          logger.error(`Failed to process recurring transaction: ${recurring.description}`, error);
        }
      }
    }
    
    return newTransactions;
  }
} 