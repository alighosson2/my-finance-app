import { transaction_type, financial_accounts, users, budgets } from '@prisma/client';

// 1. Use Prisma's generated enum directly
export { transaction_type as TransactionType };

// 2. Prisma-like Base Interface (with relationships)
export interface ITransaction {
  id: number;
  user_id: number;
  account_id: number;
  budget_id?: number | null;
  amount: number;
  transaction_date: Date;
  description: string;
  category?: string | null;
  subcategory?: string | null;
  transaction_type: transaction_type;
  merchant_name?: string | null;
  location?: string | null;
  is_recurring?: boolean | null;
  tags?: string[];
  // OBP Integration fields
  external_transaction_id?: string | null;
  import_source?: string | null;
  sync_status?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  // Relationships
  financial_account?: financial_accounts;
  user?: users;
  budget?: budgets | null;
}

// 3. Entity class with business logic
export class TransactionEntity implements ITransaction {
  private _amount: number;
  private _description: string;
  public budget_id: number | null;

  constructor(
    public id: number,
    public user_id: number,
    public account_id: number,
    amount: number,
    public transaction_date: Date,
    description: string,
    public category: string | null = null,
    public subcategory: string | null = null,
    public transaction_type: transaction_type,
    budget_id: number | null = null,
    public merchant_name: string | null = null,
    public location: string | null = null,
    public is_recurring: boolean | null = false,
    public tags: string[] = [],
    // OBP Integration fields
    public external_transaction_id: string | null = null,
    public import_source: string | null = "manual",
    public sync_status: string | null = "synced",
    public created_at: Date | null = new Date(),
    public updated_at: Date | null = new Date(),
    public financial_account?: financial_accounts,
    public user?: users,
    public budget?: budgets | null
  ) {
    this._amount = amount;
    this._description = description.trim();
    
    // Convert undefined to null for Prisma compatibility
    this.budget_id = budget_id ?? null;
    this.merchant_name = merchant_name ?? null;
    this.location = location ?? null;
    this.is_recurring = is_recurring ?? false;
    this.external_transaction_id = external_transaction_id ?? null;
    this.import_source = import_source ?? "manual";
    this.sync_status = sync_status ?? "synced";
  }

  get amount(): number {
    return this._amount;
  }

  set amount(value: number) {
    if (value <= 0) {
      throw new Error('Transaction amount must be positive');
    }
    this._amount = value;
    this.updated_at = new Date();
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    if (!value?.trim()) {
      throw new Error('Transaction description cannot be empty');
    }
    this._description = value.trim();
    this.updated_at = new Date();
  }

  get isIncome(): boolean {
    return this.transaction_type === transaction_type.income;
  }

  get isExpense(): boolean {
    return this.transaction_type === transaction_type.expense;
  }

  get isTransfer(): boolean {
    return this.transaction_type === transaction_type.transfer;
  }

  getId(): number {
    return this.id;
  }

  addTag(tag: string): void {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !this.tags.includes(cleanTag)) {
      this.tags.push(cleanTag);
      this.updated_at = new Date();
    }
  }

  removeTag(tag: string): void {
    const cleanTag = tag.trim().toLowerCase();
    const index = this.tags.indexOf(cleanTag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updated_at = new Date();
    }
  }

  setCategory(category: string | null, subcategory?: string | null): void {
    this.category = category?.trim() || null;
    this.subcategory = subcategory?.trim() || null;
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      account_id: this.account_id,
      budget_id: this.budget_id,
      amount: this.amount,
      transaction_date: this.transaction_date,
      description: this.description,
      category: this.category,
      subcategory: this.subcategory,
      transaction_type: this.transaction_type,
      merchant_name: this.merchant_name,
      location: this.location,
      is_recurring: this.is_recurring,
      tags: this.tags,
      // OBP Integration fields
      external_transaction_id: this.external_transaction_id,
      import_source: this.import_source,
      sync_status: this.sync_status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // Include relationship objects if available
      financial_account: this.financial_account,
      user: this.user,
      budget: this.budget
    };
  }
}

// 4. DTOs for API responses
export interface TransactionDto {
  id: number;
  user_id: number;
  account_id: number;
  amount: number;
  transaction_date: Date;
  description: string;
  category?: string | null;
  subcategory?: string | null;
  transaction_type: transaction_type;
  merchant_name?: string | null;
  is_recurring?: boolean | null;
  tags: string[];
  // OBP Integration fields
  external_transaction_id?: string | null;
  import_source?: string | null;
  sync_status?: string | null;
}

export interface CreateTransactionRequest {
  account_id: number;
  amount: number;
  transaction_date: Date;
  description: string;
  category?: string | null;
  subcategory?: string | null;
  transaction_type: transaction_type;
  merchant_name?: string | null;
  location?: string | null;
  is_recurring?: boolean;
  tags?: string[];
  budget_id?: number | null;
}

export interface UpdateTransactionRequest {
  account_id?: number;
  amount?: number;
  transaction_date?: Date;
  description?: string;
  category?: string | null;
  subcategory?: string | null;
  transaction_type?: transaction_type;
  merchant_name?: string | null;
  location?: string | null;
  is_recurring?: boolean;
  tags?: string[];
  budget_id?: number | null;
}

export interface TransactionSearchFilters {
  user_id?: number;
  account_id?: number;
  category?: string;
  subcategory?: string;
  transaction_type?: transaction_type;
  merchant_name?: string;
  is_recurring?: boolean;
  date_from?: Date;
  date_to?: Date;
  amount_min?: number;
  amount_max?: number;
  tags?: string[];
}

export interface TransactionListResponse {
  transactions: TransactionDto[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 5. Mapper function
export function toTransactionDto(transaction: TransactionEntity): TransactionDto {
  return {
    id: transaction.id,
    user_id: transaction.user_id,
    account_id: transaction.account_id,
    amount: transaction.amount,
    transaction_date: transaction.transaction_date,
    description: transaction.description,
    category: transaction.category,
    subcategory: transaction.subcategory,
    transaction_type: transaction.transaction_type,
    merchant_name: transaction.merchant_name,
    is_recurring: transaction.is_recurring,
    tags: transaction.tags,
    // OBP Integration fields
    external_transaction_id: transaction.external_transaction_id,
    import_source: transaction.import_source,
    sync_status: transaction.sync_status
  };
}

// 6. Helper functions and constants
export const TransactionCategories = {
  INCOME: {
    SALARY: 'Salary',
    FREELANCE: 'Freelance',
    INVESTMENT: 'Investment',
    BUSINESS: 'Business',
    OTHER_INCOME: 'Other Income'
  },
  EXPENSE: {
    FOOD: 'Food & Dining',
    TRANSPORTATION: 'Transportation',
    SHOPPING: 'Shopping',
    ENTERTAINMENT: 'Entertainment',
    UTILITIES: 'Bills & Utilities',
    HEALTHCARE: 'Healthcare',
    EDUCATION: 'Education',
    TRAVEL: 'Travel',
    OTHER_EXPENSE: 'Other Expense'
  }
};

export const TransactionHelpers = {
  isValidAmount: (amount: number): boolean => amount > 0,
  isValidType: (type: string): boolean => Object.values(transaction_type).includes(type as transaction_type),
  formatAmount: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
  categorizeByDescription: (description: string): { category: string | null; subcategory: string | null } => {
    const desc = description.toLowerCase();
    
    // Simple categorization logic based on keywords
    if (desc.includes('salary') || desc.includes('payroll')) {
      return { category: TransactionCategories.INCOME.SALARY, subcategory: null };
    }
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('gas')) {
      return { category: TransactionCategories.EXPENSE.TRANSPORTATION, subcategory: null };
    }
    if (desc.includes('restaurant') || desc.includes('food') || desc.includes('grocery')) {
      return { category: TransactionCategories.EXPENSE.FOOD, subcategory: null };
    }
    
    return { category: null, subcategory: null };
  }
}; 