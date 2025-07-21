import { PrismaClient, budgets, transactions } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { BudgetEntity, CreateBudgetRequest, UpdateBudgetRequest, BudgetSearchFilters } from '../model/BudgetModel';
import logger from '../util/logger';

export class BudgetRepository {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    if (!this.prisma) {
      this.prisma = await ConnectionManager.getConnection();
      logger.info('BudgetRepository initialized');
    }
  }

  private async getPrisma(): Promise<PrismaClient> {
    if (!this.prisma) {
      await this.init();
    }
    return this.prisma!;
  }

  // Create new budget
  async create(userId: number, data: CreateBudgetRequest): Promise<BudgetEntity> {
    const prisma = await this.getPrisma();
    
    const budget = await prisma.budgets.create({
      data: {
        user_id: userId,
        budget_name: data.name,
        category: data.category,
        budget_limit: data.amount,
        period_type: data.period,
        start_date: data.start_date,
        end_date: data.end_date || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return this.mapToEntity(budget);
  }

  // Get budget by ID
  async getById(id: number, userId: number): Promise<BudgetEntity | null> {
    const prisma = await this.getPrisma();
    
    const budget = await prisma.budgets.findFirst({
      where: {
        id,
        user_id: userId
      }
    });

    return budget ? this.mapToEntity(budget) : null;
  }

  // Get all budgets for user with filters
  async getByUser(
    userId: number, 
    page: number = 1, 
    limit: number = 20,
    filters: BudgetSearchFilters = {}
  ): Promise<{ budgets: BudgetEntity[]; total: number }> {
    const prisma = await this.getPrisma();
    
    const where: any = {
      user_id: userId
    };

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.period) {
      where.period = filters.period;
    }
    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }
    if (filters.startDate) {
      where.start_date = {
        gte: filters.startDate
      };
    }
    if (filters.endDate) {
      where.end_date = {
        lte: filters.endDate
      };
    }
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) {
        where.amount.gte = filters.amountMin;
      }
      if (filters.amountMax !== undefined) {
        where.amount.lte = filters.amountMax;
      }
    }

    const [budgets, total] = await Promise.all([
      prisma.budgets.findMany({
        where,
        orderBy: [
          { is_active: 'desc' },
          { start_date: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.budgets.count({ where })
    ]);

    return {
      budgets: budgets.map(budget => this.mapToEntity(budget)),
      total
    };
  }

  // Get active budgets for user
  async getActiveBudgets(userId: number): Promise<BudgetEntity[]> {
    const prisma = await this.getPrisma();
    
    const now = new Date();
    
    const budgets = await prisma.budgets.findMany({
      where: {
        user_id: userId,
        is_active: true,
        start_date: {
          lte: now
        },
        OR: [
          { end_date: null },
          { end_date: { gte: now } }
        ]
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    return budgets.map(budget => this.mapToEntity(budget));
  }

  // Get budgets by category
  async getBudgetsByCategory(userId: number, category: string): Promise<BudgetEntity[]> {
    const prisma = await this.getPrisma();
    
    const budgets = await prisma.budgets.findMany({
      where: {
        user_id: userId,
        category,
        is_active: true
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    return budgets.map(budget => this.mapToEntity(budget));
  }

  // Update budget
  async update(id: number, userId: number, data: Partial<budgets>): Promise<BudgetEntity | null> {
    const prisma = await this.getPrisma();
    
    try {
      const updatedBudget = await prisma.budgets.update({
        where: {
          id,
          user_id: userId
        },
        data: {
          ...data,
          updated_at: new Date()
        }
      });

      return this.mapToEntity(updatedBudget);
    } catch (error) {
      logger.error('Failed to update budget:', error);
      return null;
    }
  }

  // Delete budget
  async delete(id: number, userId: number): Promise<boolean> {
    const prisma = await this.getPrisma();
    
    try {
      // First, unlink any transactions associated with this budget
      await prisma.transactions.updateMany({
        where: {
          budget_id: id,
          user_id: userId
        },
        data: {
          budget_id: null
        }
      });

      // Then delete the budget
      await prisma.budgets.delete({
        where: {
          id,
          user_id: userId
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete budget:', error);
      return false;
    }
  }

  // Soft delete (deactivate) budget
  async deactivate(id: number, userId: number): Promise<BudgetEntity | null> {
    return await this.update(id, userId, { is_active: false });
  }

  // Get budget spending (transactions related to budget)
  async getBudgetSpending(budgetId: number, userId: number): Promise<{
    totalSpent: number;
    transactions: transactions[];
  }> {
    const prisma = await this.getPrisma();
    
    const transactions = await prisma.transactions.findMany({
      where: {
        budget_id: budgetId,
        user_id: userId,
        transaction_type: 'expense' // Only count expenses
      },
      orderBy: {
        transaction_date: 'desc'
      }
    });

    const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      totalSpent: Math.abs(totalSpent), // Make sure it's positive
      transactions
    };
  }

  // Get spending by category for budget analysis
  async getSpendingByCategory(
    userId: number, 
    startDate: Date, 
    endDate: Date, 
    category?: string
  ): Promise<{ category: string; totalSpent: number; transactionCount: number }[]> {
    const prisma = await this.getPrisma();
    
    const where: any = {
      user_id: userId,
      transaction_type: 'expense',
      transaction_date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (category) {
      where.category = category;
    }

    const transactions = await prisma.transactions.findMany({
      where,
      select: {
        category: true,
        amount: true
      }
    });

    // Group by category
    const categorySpending = new Map<string, { totalSpent: number; count: number }>();
    
    transactions.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      const existing = categorySpending.get(cat) || { totalSpent: 0, count: 0 };
      existing.totalSpent += Math.abs(Number(tx.amount));
      existing.count += 1;
      categorySpending.set(cat, existing);
    });

    return Array.from(categorySpending.entries()).map(([category, data]) => ({
      category,
      totalSpent: data.totalSpent,
      transactionCount: data.count
    }));
  }

  // Check if budget name exists for user
  async budgetNameExists(userId: number, name: string, excludeId?: number): Promise<boolean> {
    const prisma = await this.getPrisma();
    
    const where: any = {
      user_id: userId,
      name,
      is_active: true
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await prisma.budgets.count({ where });
    return count > 0;
  }

  // Get budget categories used by user
  async getUserBudgetCategories(userId: number): Promise<string[]> {
    const prisma = await this.getPrisma();
    
    const results = await prisma.budgets.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    return results.map(r => r.category);
  }

  // Private helper to map Prisma record to Entity
  private mapToEntity(budget: budgets): BudgetEntity {
    return new BudgetEntity(
      budget.id,
      budget.user_id,
      budget.budget_name,
      budget.category,
      Number(budget.budget_limit),
      budget.period_type,
      budget.start_date,
      budget.end_date,
      budget.is_active,
      budget.created_at,
      budget.updated_at
    );
  }
} 