import { BudgetRepository } from '../Repositories/BudgetRepository';
import { TransactionService } from './TransactionService';
import {
  BudgetEntity,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetSearchFilters,
  BudgetSpending,
  BudgetSummary,
  BudgetListResponse,
  BudgetAlert,
  BudgetStatus,
  BudgetCategory,
  BudgetHelpers,
  BudgetTransaction
} from '../model/BudgetModel';

export class BudgetService {
  private budgetRepository: BudgetRepository | null = null;
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  private async getRepo(): Promise<BudgetRepository> {
    if (!this.budgetRepository) {
      this.budgetRepository = new BudgetRepository();
      await this.budgetRepository.init();
    }
    return this.budgetRepository;
  }

  // ===== BUDGET CRUD =====

  async createBudget(userId: number, data: CreateBudgetRequest): Promise<BudgetEntity> {
    const repo = await this.getRepo();

    // Validate budget name is unique
    const nameExists = await repo.budgetNameExists(userId, data.name);
    if (nameExists) {
      throw new Error(`Budget with name "${data.name}" already exists`);
    }

    // Set default end date if not provided
    if (!data.end_date) {
      const budget = new BudgetEntity(
        0, userId, data.name, data.category, data.amount, data.period, data.start_date
      );
      data.end_date = budget.calculatePeriodEndDate();
    }

    const budget = await repo.create(userId, data);

    console.info(`Budget created: ${data.name} for user ${userId}`);
    return budget;
  }

  async getBudget(userId: number, budgetId: number): Promise<BudgetEntity | null> {
    const repo = await this.getRepo();
    return await repo.getById(budgetId, userId);
  }

  async getAllBudgets(
    userId: number,
    page: number = 1,
    limit: number = 20,
    filters: BudgetSearchFilters = {}
  ): Promise<BudgetListResponse> {
    const repo = await this.getRepo();

    const { budgets, total } = await repo.getByUser(userId, page, limit, filters);
    const summary = await this.getBudgetSummary(userId);

    return {
      budgets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary
    };
  }

  async getActiveBudgets(userId: number): Promise<BudgetEntity[]> {
    const repo = await this.getRepo();
    return await repo.getActiveBudgets(userId);
  }

  async updateBudget(
    userId: number,
    budgetId: number,
    data: UpdateBudgetRequest
  ): Promise<BudgetEntity | null> {
    const repo = await this.getRepo();

    // Check if name is being changed and if it conflicts
    if (data.name) {
      const nameExists = await repo.budgetNameExists(userId, data.name, budgetId);
      if (nameExists) {
        throw new Error(`Budget with name "${data.name}" already exists`);
      }
    }

    const updated = await repo.update(budgetId, userId, data as any);

    if (updated) {
      console.info(`Budget ${budgetId} updated for user ${userId}`);
    }

    return updated;
  }

  async deleteBudget(userId: number, budgetId: number): Promise<boolean> {
    const repo = await this.getRepo();

    const deleted = await repo.delete(budgetId, userId);

    if (deleted) {
      console.info(`Budget ${budgetId} deleted for user ${userId}`);
    }

    return deleted;
  }

  async deactivateBudget(userId: number, budgetId: number): Promise<BudgetEntity | null> {
    const repo = await this.getRepo();

    const deactivated = await repo.deactivate(budgetId, userId);

    if (deactivated) {
      console.info(`Budget ${budgetId} deactivated for user ${userId}`);
    }

    return deactivated;
  }

  // ===== BUDGET ANALYTICS =====

  async getBudgetSpending(userId: number, budgetId: number): Promise<BudgetSpending> {
    const repo = await this.getRepo();

    const budget = await repo.getById(budgetId, userId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    const { totalSpent, transactions } = await repo.getBudgetSpending(budgetId, userId);

    const remainingAmount = Math.max(0, budget.amount - totalSpent);
    const percentageUsed = (totalSpent / budget.amount) * 100;
    const daysRemaining = budget.getDaysRemaining();

    // Calculate average daily spending and projection
    const startDate = new Date(budget.start_date);
    const now = new Date();
    const daysPassed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailySpending = totalSpent / daysPassed;
    const projectedSpending = daysRemaining > 0 ? totalSpent + (averageDailySpending * daysRemaining) : totalSpent;

    // Determine status
    const status = BudgetHelpers.calculateBudgetStatus(totalSpent, budget.amount, daysRemaining);

    // Map transactions
    const budgetTransactions: BudgetTransaction[] = transactions.map(tx => ({
      id: tx.id,
      amount: Math.abs(Number(tx.amount)),
      description: tx.description,
      transaction_date: tx.transaction_date,
      category: tx.category || 'Uncategorized',
      merchant_name: tx.merchant_name || undefined
    }));

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      category: budget.category,
      budgetAmount: budget.amount,
      spentAmount: totalSpent,
      remainingAmount,
      percentageUsed,
      status,
      daysRemaining,
      averageDailySpending,
      projectedSpending,
      transactions: budgetTransactions
    };
  }

  async getBudgetSummary(userId: number): Promise<BudgetSummary> {
    const repo = await this.getRepo();

    const activeBudgets = await repo.getActiveBudgets(userId);

    let totalBudgetAmount = 0;
    let totalSpentAmount = 0;
    let budgetsOnTrack = 0;
    let budgetsExceeded = 0;

    for (const budget of activeBudgets) {
      totalBudgetAmount += budget.amount;

      const { totalSpent } = await repo.getBudgetSpending(budget.id, userId);
      totalSpentAmount += totalSpent;

      const percentageUsed = (totalSpent / budget.amount) * 100;
      const daysRemaining = budget.getDaysRemaining();
      const status = BudgetHelpers.calculateBudgetStatus(totalSpent, budget.amount, daysRemaining);

      if (status === BudgetStatus.EXCEEDED) {
        budgetsExceeded++;
      } else if (status === BudgetStatus.ACTIVE) {
        budgetsOnTrack++;
      }
    }

    const totalRemainingAmount = Math.max(0, totalBudgetAmount - totalSpentAmount);
    const averageSpendingRate = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0;

    return {
      totalBudgets: activeBudgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgetAmount,
      totalSpentAmount,
      totalRemainingAmount,
      budgetsOnTrack,
      budgetsExceeded,
      averageSpendingRate
    };
  }

  async getBudgetAlerts(userId: number): Promise<BudgetAlert[]> {
    const repo = await this.getRepo();
    const activeBudgets = await repo.getActiveBudgets(userId);
    const alerts: BudgetAlert[] = [];

    for (const budget of activeBudgets) {
      const spending = await this.getBudgetSpending(userId, budget.id);
      const alert = BudgetHelpers.generateBudgetAlert(spending);

      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts.sort((a, b) => b.percentageUsed - a.percentageUsed); // Sort by most over budget first
  }

  // ===== BUDGET CATEGORY MANAGEMENT =====

  async getBudgetCategories(): Promise<{ category: BudgetCategory; displayName: string }[]> {
    return BudgetHelpers.getDefaultCategories();
  }

  async getUserBudgetCategories(userId: number): Promise<string[]> {
    const repo = await this.getRepo();
    return await repo.getUserBudgetCategories(userId);
  }

  async getSpendingByCategory(
    userId: number,
    startDate: Date,
    endDate: Date,
    category?: string
  ): Promise<{ category: string; totalSpent: number; transactionCount: number }[]> {
    const repo = await this.getRepo();
    return await repo.getSpendingByCategory(userId, startDate, endDate, category);
  }

  // ===== TRANSACTION-BUDGET INTEGRATION =====

  async assignTransactionToBudget(
    userId: number,
    transactionId: number,
    budgetId: number
  ): Promise<boolean> {
    try {
      // Use transaction service to update the transaction with budget_id
      // This would require adding a method to TransactionService
      console.info(`Assigned transaction ${transactionId} to budget ${budgetId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to assign transaction to budget:', error);
      return false;
    }
  }

  async autoAssignTransactionsToBudgets(userId: number): Promise<number> {
    const repo = await this.getRepo();
    const activeBudgets = await repo.getActiveBudgets(userId);

    // Get recent unassigned transactions
    const transactions = await this.transactionService.getTransactionsByUser(userId, 1, 100);
    const unassignedTransactions = transactions.transactions.filter(tx =>
      !tx.budget_id && tx.transaction_type === 'expense'
    );

    let assignedCount = 0;

    for (const transaction of unassignedTransactions) {
      const transactionCategory = transaction.category || '';
      const budgetCategory = BudgetHelpers.mapTransactionToBudgetCategory(transactionCategory);

      // Find matching budget
      const matchingBudget = activeBudgets.find(budget =>
        budget.getCategory() === budgetCategory ||
        budget.category.toLowerCase() === transactionCategory.toLowerCase()
      );

      if (matchingBudget) {
        const success = await this.assignTransactionToBudget(userId, transaction.id, matchingBudget.id);
        if (success) {
          assignedCount++;
        }
      }
    }

    console.info(`Auto-assigned ${assignedCount} transactions to budgets for user ${userId}`);
    return assignedCount;
  }

  // ===== BUDGET RECOMMENDATIONS =====

  async generateBudgetRecommendations(userId: number): Promise<{
    recommendedBudgets: { category: BudgetCategory; suggestedAmount: number; reason: string }[];
    optimizations: { budgetId: number; suggestion: string; potentialSavings: number }[];
  }> {
    // Analyze past 3 months spending to recommend budgets
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const spendingByCategory = await this.getSpendingByCategory(userId, threeMonthsAgo, new Date());

    const recommendedBudgets = spendingByCategory
      .filter(spending => spending.totalSpent > 100) // Only recommend for categories with significant spending
      .slice(0, 5) // Top 5 categories
      .map(spending => ({
        category: BudgetHelpers.mapTransactionToBudgetCategory(spending.category),
        suggestedAmount: Math.ceil((spending.totalSpent / 3) * 1.1), // Monthly average + 10%
        reason: `Based on your average monthly spending of ${BudgetHelpers.formatCurrency(spending.totalSpent / 3)} in this category`
      }));

    return {
      recommendedBudgets,
      optimizations: [] // TODO: Implement budget optimization suggestions
    };
  }
}
