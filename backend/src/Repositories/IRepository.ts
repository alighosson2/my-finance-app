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