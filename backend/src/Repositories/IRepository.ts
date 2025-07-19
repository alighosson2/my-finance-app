// src/Repositories/IRepository.ts
import { users, BankToken, financial_accounts, transactions } from "@prisma/client";
import { UserEntity } from "../model/Usermodel";
import { BankTokenEntity } from "../model/Bankmodel";
import { FinancialAccountEntity } from "../model/FinancialAccountModel";
import { TransactionEntity, TransactionSearchFilters } from "../model/TransactionModel";

export type id = number;

export interface ID {
  getId(): id;
}

export interface initializable {
  init(): Promise<void>;
}

export interface IRepository<T> {
  create(item: T): Promise<T>;
  get(id: id): Promise<T>;
  getAll(): Promise<T[]>;
  delete(id: id): Promise<void>;
  update(id: id, item: T): Promise<T | null>;
}

// User-specific repository interface
export interface IUserRepositoryExtensions {
  getByEmail(email: string): Promise<UserEntity>;
  getWithBankTokens(id: id): Promise<UserEntity>;
  getWithAccounts(id: id): Promise<UserEntity>;
}

// Bank-specific repository interface
export interface IBankRepositoryExtensions {
  getTokensByUser(userId: number): Promise<BankTokenEntity[]>;
  getTokenById(id: number): Promise<BankTokenEntity | null>;
}

// Financial Account-specific repository interface
export interface IFinancialAccountRepositoryExtensions {
  getAccountsByUser(userId: number): Promise<FinancialAccountEntity[]>;
  getAccountById(id: number): Promise<FinancialAccountEntity | null>;
  getActiveAccountsByUser(userId: number): Promise<FinancialAccountEntity[]>;
  getAccountSummaryByUser(userId: number): Promise<any>;
  updateBalance(id: number, balance: number): Promise<FinancialAccountEntity | null>;
}

// Transaction-specific repository interface
export interface ITransactionRepositoryExtensions {
  getTransactionsByUser(userId: number, page?: number, limit?: number): Promise<{ transactions: TransactionEntity[]; total: number }>;
  getTransactionsByAccount(accountId: number, page?: number, limit?: number): Promise<{ transactions: TransactionEntity[]; total: number }>;
  searchTransactions(filters: TransactionSearchFilters, page?: number, limit?: number): Promise<{ transactions: TransactionEntity[]; total: number }>;
  getTransactionsByCategory(userId: number, category: string, page?: number, limit?: number): Promise<{ transactions: TransactionEntity[]; total: number }>;
  getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date, page?: number, limit?: number): Promise<{ transactions: TransactionEntity[]; total: number }>;
  getRecurringTransactions(userId: number): Promise<TransactionEntity[]>;
  getMonthlyTransactionSummary(userId: number, year: number, month: number): Promise<any>;
  getCategorySpending(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
  getTransactionById(id: number): Promise<TransactionEntity | null>;
}

export interface initializableRepository<T> extends IRepository<T>, initializable {
  init(): Promise<void>;
}

// Combined interface for UserRepository
export interface IUserRepository extends initializableRepository<users>, IUserRepositoryExtensions {}

// Combined interface for BankRepository
export interface IBankRepository extends initializableRepository<BankToken>, IBankRepositoryExtensions {}

// Combined interface for FinancialAccountRepository
export interface IFinancialAccountRepository extends initializableRepository<financial_accounts>, IFinancialAccountRepositoryExtensions {}

// Combined interface for TransactionRepository
export interface ITransactionRepository extends initializableRepository<transactions>, ITransactionRepositoryExtensions {}