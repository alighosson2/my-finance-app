import { financial_accounts, account_type } from '@prisma/client';

export interface IFinancialAccount {
  id: number;
  user_id: number;
  bank_token_id?: number | null;
  account_name: string;
  account_type: account_type; // Use the Prisma enum type
  balance: number;
  currency: string;
  bank_name?: string | null;
  account_number_masked?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class FinancialAccountEntity implements IFinancialAccount {
  constructor(
    public id: number,
    public user_id: number,
    public bank_token_id: number | null,
    public account_name: string,
    public account_type: account_type, // Use the Prisma enum type
    public balance: number,
    public currency: string,
    public bank_name: string | null,
    public account_number_masked: string | null,
    public is_active: boolean,
    public created_at: Date,
    public updated_at: Date
  ) {}

  static fromPrisma(account: financial_accounts & { bank_token_id?: number | null }): FinancialAccountEntity {
    return new FinancialAccountEntity(
      account.id,
      account.user_id,
      account.bank_token_id || null,
      account.account_name,
      account.account_type,
      Number(account.balance),
      account.currency,
      account.bank_name,
      account.account_number_masked,
      account.is_active ?? true,
      account.created_at ?? new Date(),
      account.updated_at ?? new Date()
    );
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      bank_token_id: this.bank_token_id,
      account_name: this.account_name,
      account_type: this.account_type,
      balance: this.balance,
      currency: this.currency,
      bank_name: this.bank_name,
      account_number_masked: this.account_number_masked,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export interface CreateFinancialAccountDto {
  user_id: number;
  bank_token_id?: number;
  account_name: string;
  account_type: string; // Keep as string for input validation
  balance?: number;
  currency?: string;
  bank_name?: string;
  account_number_masked?: string;
  is_active?: boolean;
}

export interface UpdateFinancialAccountDto {
  bank_token_id?: number | null;
  account_name?: string;
  account_type?: string; // Keep as string for input validation
  balance?: number;
  currency?: string;
  bank_name?: string | null;
  account_number_masked?: string | null;
  is_active?: boolean;
}

export interface AccountBalanceUpdateDto {
  balance: number;
}

export interface AccountSummary {
  total_balance: number;
  accounts_by_type: Record<string, number>;
  currency_breakdown: Record<string, number>;
  active_accounts: number;
  total_accounts: number;
}