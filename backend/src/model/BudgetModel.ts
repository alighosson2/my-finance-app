import { budgets, users, transactions } from '@prisma/client';

// ===== BUDGET ENUMS =====

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly', 
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum BudgetCategory {
  GROCERIES = 'groceries',
  DINING = 'dining',
  TRANSPORTATION = 'transportation',
  ENTERTAINMENT = 'entertainment',
  UTILITIES = 'utilities',
  HEALTHCARE = 'healthcare',
  SHOPPING = 'shopping',
  TRAVEL = 'travel',
  EDUCATION = 'education',
  SUBSCRIPTIONS = 'subscriptions',
  INSURANCE = 'insurance',
  SAVINGS = 'savings',
  DEBT_PAYMENT = 'debt_payment',
  OTHER = 'other'
}

export enum BudgetStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXCEEDED = 'exceeded'
}

// ===== BUDGET INTERFACES =====

export interface IBudget {
  id: number;
  user_id: number;
  name: string;
  category: string;
  amount: number;
  period: string;
  start_date: Date;
  end_date: Date | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  // Relationships
  user?: users;
  transactions?: transactions[];
}

export interface CreateBudgetRequest {
  name: string;
  category: BudgetCategory;
  amount: number;
  period: BudgetPeriod;
  start_date: Date;
  end_date?: Date;
}

export interface UpdateBudgetRequest {
  name?: string;
  category?: BudgetCategory;
  amount?: number;
  period?: BudgetPeriod;
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
}

// ===== BUDGET ANALYTICS =====

export interface BudgetSpending {
  budgetId: number;
  budgetName: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: BudgetStatus;
  daysRemaining: number;
  averageDailySpending: number;
  projectedSpending: number;
  transactions: BudgetTransaction[];
}

export interface BudgetTransaction {
  id: number;
  amount: number;
  description: string;
  transaction_date: Date;
  category: string;
  merchant_name?: string;
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  budgetsOnTrack: number;
  budgetsExceeded: number;
  averageSpendingRate: number;
}

export interface BudgetAlert {
  budgetId: number;
  budgetName: string;
  alertType: 'warning' | 'exceeded' | 'completed';
  message: string;
  percentageUsed: number;
  recommendedAction: string;
}

// ===== BUDGET SEARCH & FILTERS =====

export interface BudgetSearchFilters {
  category?: BudgetCategory;
  period?: BudgetPeriod;
  status?: BudgetStatus;
  startDate?: Date;
  endDate?: Date;
  amountMin?: number;
  amountMax?: number;
  isActive?: boolean;
}

export interface BudgetListResponse {
  budgets: BudgetEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: BudgetSummary;
}

// ===== BUDGET ENTITY CLASS =====

export class BudgetEntity implements IBudget {
  constructor(
    public id: number,
    public user_id: number,
    public name: string,
    public category: string,
    public amount: number,
    public period: string,
    public start_date: Date,
    public end_date: Date | null = null,
    public is_active: boolean | null = true,
    public created_at: Date | null = null,
    public updated_at: Date | null = null
  ) {}

  // Get budget period as enum
  getPeriod(): BudgetPeriod {
    return this.period as BudgetPeriod;
  }

  // Get category as enum
  getCategory(): BudgetCategory {
    return this.category as BudgetCategory;
  }

  // Check if budget is currently active and within date range
  isCurrentlyActive(): boolean {
    if (!this.is_active) return false;
    
    const now = new Date();
    const startDate = new Date(this.start_date);
    
    if (now < startDate) return false;
    
    if (this.end_date) {
      const endDate = new Date(this.end_date);
      if (now > endDate) return false;
    }
    
    return true;
  }

  // Calculate days remaining in budget period
  getDaysRemaining(): number {
    if (!this.end_date) {
      // Calculate end date based on period
      const endDate = this.calculatePeriodEndDate();
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    const now = new Date();
    const endDate = new Date(this.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Calculate period end date if not specified
  calculatePeriodEndDate(): Date {
    const startDate = new Date(this.start_date);
    
    switch (this.getPeriod()) {
      case BudgetPeriod.WEEKLY:
        return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      case BudgetPeriod.MONTHLY:
        const monthlyEnd = new Date(startDate);
        monthlyEnd.setMonth(monthlyEnd.getMonth() + 1);
        return monthlyEnd;
      case BudgetPeriod.QUARTERLY:
        const quarterlyEnd = new Date(startDate);
        quarterlyEnd.setMonth(quarterlyEnd.getMonth() + 3);
        return quarterlyEnd;
      case BudgetPeriod.YEARLY:
        const yearlyEnd = new Date(startDate);
        yearlyEnd.setFullYear(yearlyEnd.getFullYear() + 1);
        return yearlyEnd;
      default:
        return new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }
  }

  // Format for JSON response
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      category: this.category,
      amount: parseFloat(this.amount.toString()),
      period: this.period,
      start_date: this.start_date,
      end_date: this.end_date,
      is_active: this.is_active,
      is_currently_active: this.isCurrentlyActive(),
      days_remaining: this.getDaysRemaining(),
      period_end_date: this.end_date || this.calculatePeriodEndDate(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

// ===== BUDGET HELPERS =====

export class BudgetHelpers {
  // Get default budget categories
  static getDefaultCategories(): { category: BudgetCategory; displayName: string }[] {
    return [
      { category: BudgetCategory.GROCERIES, displayName: 'Groceries & Food' },
      { category: BudgetCategory.DINING, displayName: 'Dining Out' },
      { category: BudgetCategory.TRANSPORTATION, displayName: 'Transportation' },
      { category: BudgetCategory.ENTERTAINMENT, displayName: 'Entertainment' },
      { category: BudgetCategory.UTILITIES, displayName: 'Utilities' },
      { category: BudgetCategory.HEALTHCARE, displayName: 'Healthcare' },
      { category: BudgetCategory.SHOPPING, displayName: 'Shopping' },
      { category: BudgetCategory.TRAVEL, displayName: 'Travel' },
      { category: BudgetCategory.EDUCATION, displayName: 'Education' },
      { category: BudgetCategory.SUBSCRIPTIONS, displayName: 'Subscriptions' },
      { category: BudgetCategory.INSURANCE, displayName: 'Insurance' },
      { category: BudgetCategory.SAVINGS, displayName: 'Savings' },
      { category: BudgetCategory.DEBT_PAYMENT, displayName: 'Debt Payment' },
      { category: BudgetCategory.OTHER, displayName: 'Other' }
    ];
  }

  // Map transaction category to budget category
  static mapTransactionToBudgetCategory(transactionCategory: string): BudgetCategory {
    const categoryLower = transactionCategory.toLowerCase();
    
    if (categoryLower.includes('grocery') || categoryLower.includes('supermarket')) {
      return BudgetCategory.GROCERIES;
    }
    if (categoryLower.includes('restaurant') || categoryLower.includes('food') || categoryLower.includes('dining')) {
      return BudgetCategory.DINING;
    }
    if (categoryLower.includes('gas') || categoryLower.includes('fuel') || categoryLower.includes('transport') || categoryLower.includes('uber') || categoryLower.includes('taxi')) {
      return BudgetCategory.TRANSPORTATION;
    }
    if (categoryLower.includes('entertainment') || categoryLower.includes('movie') || categoryLower.includes('music')) {
      return BudgetCategory.ENTERTAINMENT;
    }
    if (categoryLower.includes('utility') || categoryLower.includes('electric') || categoryLower.includes('internet') || categoryLower.includes('phone')) {
      return BudgetCategory.UTILITIES;
    }
    if (categoryLower.includes('medical') || categoryLower.includes('health') || categoryLower.includes('pharmacy')) {
      return BudgetCategory.HEALTHCARE;
    }
    if (categoryLower.includes('shopping') || categoryLower.includes('retail') || categoryLower.includes('amazon')) {
      return BudgetCategory.SHOPPING;
    }
    if (categoryLower.includes('travel') || categoryLower.includes('hotel') || categoryLower.includes('flight')) {
      return BudgetCategory.TRAVEL;
    }
    if (categoryLower.includes('education') || categoryLower.includes('tuition') || categoryLower.includes('book')) {
      return BudgetCategory.EDUCATION;
    }
    if (categoryLower.includes('subscription') || categoryLower.includes('netflix') || categoryLower.includes('spotify')) {
      return BudgetCategory.SUBSCRIPTIONS;
    }
    if (categoryLower.includes('insurance')) {
      return BudgetCategory.INSURANCE;
    }
    if (categoryLower.includes('saving') || categoryLower.includes('investment')) {
      return BudgetCategory.SAVINGS;
    }
    if (categoryLower.includes('loan') || categoryLower.includes('debt') || categoryLower.includes('payment')) {
      return BudgetCategory.DEBT_PAYMENT;
    }
    
    return BudgetCategory.OTHER;
  }

  // Calculate budget status based on spending
  static calculateBudgetStatus(spent: number, budgetAmount: number, daysRemaining: number): BudgetStatus {
    const percentageUsed = (spent / budgetAmount) * 100;
    
    if (percentageUsed >= 100) {
      return BudgetStatus.EXCEEDED;
    }
    
    if (daysRemaining <= 0) {
      return BudgetStatus.COMPLETED;
    }
    
    // If spending more than 80% with more than 20% of time remaining, it's at risk
    const timeUsed = daysRemaining > 0 ? 1 - (daysRemaining / 30) : 1; // Assume 30-day period
    if (percentageUsed > 80 && timeUsed < 0.8) {
      return BudgetStatus.EXCEEDED;
    }
    
    return BudgetStatus.ACTIVE;
  }

  // Generate budget alerts
  static generateBudgetAlert(budgetSpending: BudgetSpending): BudgetAlert | null {
    const { percentageUsed, budgetName, budgetId } = budgetSpending;
    
    if (percentageUsed >= 100) {
      return {
        budgetId,
        budgetName,
        alertType: 'exceeded',
        message: `Budget exceeded! You've spent ${percentageUsed.toFixed(1)}% of your ${budgetName} budget.`,
        percentageUsed,
        recommendedAction: 'Consider reducing spending in this category or adjusting your budget.'
      };
    }
    
    if (percentageUsed >= 80) {
      return {
        budgetId,
        budgetName,
        alertType: 'warning',
        message: `Warning: You've used ${percentageUsed.toFixed(1)}% of your ${budgetName} budget.`,
        percentageUsed,
        recommendedAction: 'Monitor spending closely to stay within budget.'
      };
    }
    
    if (budgetSpending.daysRemaining <= 0 && percentageUsed < 100) {
      return {
        budgetId,
        budgetName,
        alertType: 'completed',
        message: `Budget period completed. You spent ${percentageUsed.toFixed(1)}% of your ${budgetName} budget.`,
        percentageUsed,
        recommendedAction: 'Great job staying within budget! Consider creating a new budget for next period.'
      };
    }
    
    return null;
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format percentage for display
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }
} 