import { financial_accounts, account_type } from '@prisma/client';

export interface FinancialAccountModel {
  id?: number;
  user_id: number;
  bank_token_id?: number | null;
  account_name: string;
  account_type: account_type;
  balance: any; // Handles both number and Prisma Decimal
  currency: string;
  bank_name?: string | null;
  account_number_masked?: string | null;
  
  // OBP Integration fields
  external_account_id?: string | null;
  bank_id?: string | null;
  last_synced_at?: Date | null;
  
  is_active: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface CreateFinancialAccountDTO {
  user_id: number;
  bank_token_id?: number | null;
  account_name: string;
  account_type: account_type;
  balance: any;
  currency: string;
  bank_name?: string | null;
  account_number_masked?: string | null;
  external_account_id?: string | null;
  bank_id?: string | null;
}

export interface UpdateFinancialAccountDTO {
  account_name?: string;
  account_type?: account_type | string;  // Allow both enum and string for flexibility
  balance?: any;
  currency?: string;
  bank_name?: string | null;
  account_number_masked?: string | null;
  external_account_id?: string | null;
  bank_id?: string | null;
  last_synced_at?: Date | null;
  is_active?: boolean | null;
}

export interface FinancialAccountSummary {
  total_accounts: number;
  total_balance: number;
  accounts_by_type: Record<string, number>;
  last_sync_status: {
    synced_accounts: number;
    needs_sync: number;
    sync_errors: number;
  };
}