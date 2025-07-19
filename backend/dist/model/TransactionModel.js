"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionHelpers = exports.TransactionCategories = exports.TransactionEntity = exports.TransactionType = void 0;
exports.toTransactionDto = toTransactionDto;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "TransactionType", { enumerable: true, get: function () { return client_1.transaction_type; } });
// 3. Entity class with business logic
class TransactionEntity {
    constructor(id, user_id, account_id, amount, transaction_date, description, transaction_type, budget_id = null, group_budget_id = null, category = null, subcategory = null, merchant_name = null, location = null, is_recurring = false, tags = [], created_at = new Date(), updated_at = new Date(), financial_account, user, budget, group_budget) {
        this.id = id;
        this.user_id = user_id;
        this.account_id = account_id;
        this.transaction_date = transaction_date;
        this.transaction_type = transaction_type;
        this.is_recurring = is_recurring;
        this.tags = tags;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.financial_account = financial_account;
        this.user = user;
        this.budget = budget;
        this.group_budget = group_budget;
        this._amount = amount;
        this._description = description.trim();
        // Convert undefined to null for Prisma compatibility
        this.budget_id = budget_id ?? null;
        this.group_budget_id = group_budget_id ?? null;
        this.category = category ?? null;
        this.subcategory = subcategory ?? null;
        this.merchant_name = merchant_name ?? null;
        this.location = location ?? null;
    }
    get amount() {
        return this._amount;
    }
    set amount(value) {
        if (value <= 0) {
            throw new Error('Transaction amount must be positive');
        }
        this._amount = value;
        this.updated_at = new Date();
    }
    get description() {
        return this._description;
    }
    set description(value) {
        if (!value?.trim()) {
            throw new Error('Transaction description cannot be empty');
        }
        this._description = value.trim();
        this.updated_at = new Date();
    }
    get isIncome() {
        return this.transaction_type === client_1.transaction_type.income;
    }
    get isExpense() {
        return this.transaction_type === client_1.transaction_type.expense;
    }
    get isTransfer() {
        return this.transaction_type === client_1.transaction_type.transfer;
    }
    getId() {
        return this.id;
    }
    addTag(tag) {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag && !this.tags.includes(cleanTag)) {
            this.tags.push(cleanTag);
            this.updated_at = new Date();
        }
    }
    removeTag(tag) {
        const cleanTag = tag.trim().toLowerCase();
        const index = this.tags.indexOf(cleanTag);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updated_at = new Date();
        }
    }
    setCategory(category, subcategory) {
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
            group_budget_id: this.group_budget_id,
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
            created_at: this.created_at,
            updated_at: this.updated_at,
            financial_account: this.financial_account,
            user: this.user,
            budget: this.budget,
            group_budget: this.group_budget
        };
    }
}
exports.TransactionEntity = TransactionEntity;
// 5. Mapper function
function toTransactionDto(transaction) {
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
        tags: transaction.tags
    };
}
// 6. Helper functions and constants
exports.TransactionCategories = {
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
exports.TransactionHelpers = {
    isValidAmount: (amount) => amount > 0,
    isValidType: (type) => Object.values(client_1.transaction_type).includes(type),
    formatAmount: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    },
    categorizeByDescription: (description) => {
        const desc = description.toLowerCase();
        // Simple categorization logic based on keywords
        if (desc.includes('salary') || desc.includes('payroll')) {
            return { category: exports.TransactionCategories.INCOME.SALARY, subcategory: null };
        }
        if (desc.includes('uber') || desc.includes('taxi') || desc.includes('gas')) {
            return { category: exports.TransactionCategories.EXPENSE.TRANSPORTATION, subcategory: null };
        }
        if (desc.includes('restaurant') || desc.includes('food') || desc.includes('grocery')) {
            return { category: exports.TransactionCategories.EXPENSE.FOOD, subcategory: null };
        }
        return { category: null, subcategory: null };
    }
};
//# sourceMappingURL=TransactionModel.js.map