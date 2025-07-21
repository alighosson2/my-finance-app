// src/Repositories/IRepository.ts
import { users, BankToken, financial_accounts } from "@prisma/client";
import { UserEntity } from "../model/Usermodel";
import { BankTokenEntity } from "../model/Bankmodel";

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

export interface initializableRepository<T> extends IRepository<T>, initializable {
  init(): Promise<void>;
}

// Combined interface for UserRepository
export interface IUserRepository extends initializableRepository<users>, IUserRepositoryExtensions {}

// Combined interface for BankRepository
export interface IBankRepository extends initializableRepository<BankToken>, IBankRepositoryExtensions {}

// Transaction repository interface
export interface ITransactionRepository extends initializableRepository<any> {
  getByUserId(userId: number, page?: number, limit?: number): Promise<any[]>;
  getByAccountId(accountId: number, page?: number, limit?: number): Promise<any[]>;
  getTransactionById(id: number): Promise<any>;
  getTransactionsByUser(userId: number, page?: number, limit?: number): Promise<any>;
  getTransactionsByAccount(accountId: number, page?: number, limit?: number): Promise<any>;
  searchTransactions(filters: any, page?: number, limit?: number): Promise<any>;
  getTransactionsByCategory(userId: number, category: string, page?: number, limit?: number): Promise<any>;
  getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date, page?: number, limit?: number): Promise<any>;
  getRecurringTransactions(userId: number): Promise<any[]>;
  getMonthlyTransactionSummary(userId: number, year: number, month: number): Promise<any>;
  getCategorySpending(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
}