import { PrismaClient, financial_accounts } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ConnectionManager } from './ConnectionManager';
import { id, IFinancialAccountRepository } from './IRepository';
import logger from '../util/logger';
import { FinancialAccountEntity } from '../model/FinancialAccountModel';

function toFinancialAccountEntity(account: financial_accounts & { bank_token_id?: number | null }): FinancialAccountEntity {
  return new FinancialAccountEntity(
    account.id,
    account.user_id,
    account.bank_token_id,
    account.account_name,
    account.account_type,
    Number(account.balance),
    account.currency,
    account.bank_name,
    account.account_number_masked,
    // OBP Integration fields
    (account as any).external_account_id || null,
    (account as any).bank_id || null,
    (account as any).last_synced_at || null,
    account.is_active ?? true,
    account.created_at ?? new Date(),
    account.updated_at ?? new Date()
  );
}

export class FinancialAccountRepository implements IFinancialAccountRepository {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    this.prisma = await ConnectionManager.getConnection();
  }

  private ensureConnected(): void {
    if (!this.prisma) throw new Error('Database not initialized');
  }

  private parseId(id: id): number {
    if (id <= 0) {
      throw new Error('Invalid account ID');
    }
    return id;
  }

  async create(account: financial_accounts): Promise<financial_accounts> {
    this.ensureConnected();

    // Validate required fields
    if (!account.user_id || account.user_id <= 0) {
      throw new Error('Valid user_id is required');
    }

    if (!account.account_name || account.account_name.trim() === '') {
      throw new Error('Account name is required');
    }

    if (!account.account_type || account.account_type.toString().trim() === '') {
      throw new Error('Account type is required');
    }

    // Create the account without the id field (auto-generated)
    const createData = {
      user_id: account.user_id,
      bank_token_id: account.bank_token_id,
      account_name: account.account_name,
      account_type: account.account_type,
      balance: new Decimal(Number(account.balance) || 0),
      currency: account.currency || 'USD',
      bank_name: account.bank_name,
      account_number_masked: account.account_number_masked,
      is_active: account.is_active ?? true,
      created_at: account.created_at || new Date(),
      updated_at: account.updated_at || new Date()
    };

    const result = await this.prisma!.financial_accounts.create({
      data: createData
    });

    return result;
  }

  async update(id: id, account: financial_accounts): Promise<financial_accounts | null> {
    this.ensureConnected();
    this.parseId(id);

    try {
      const existing = await this.prisma!.financial_accounts.findUnique({
        where: { id },
      });

      if (!existing) {
        return null;
      }

      const updateData = {
        bank_token_id: account.bank_token_id,
        account_name: account.account_name,
        account_type: account.account_type,
        balance: new Decimal(Number(account.balance)),
        currency: account.currency,
        bank_name: account.bank_name,
        account_number_masked: account.account_number_masked,
        is_active: account.is_active,
        updated_at: new Date()
      };

      return this.prisma!.financial_accounts.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      throw new Error(`Failed to update account: ${(error as Error).message}`);
    }
  }

  async get(id: id): Promise<financial_accounts> {
    this.ensureConnected();
    this.parseId(id);

    try {
      const account = await this.prisma!.financial_accounts.findUnique({
        where: { id },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      return account;
    } catch (error) {
      if ((error as Error).message === 'Account not found') {
        throw error;
      }
      throw new Error(`Failed to get account: ${(error as Error).message}`);
    }
  }

  async getAll(): Promise<financial_accounts[]> {
    this.ensureConnected();
    return this.prisma!.financial_accounts.findMany();
  }

  async delete(id: id): Promise<void> {
    this.ensureConnected();
    this.parseId(id);

    try {
      const existing = await this.prisma!.financial_accounts.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Account not found');
      }

      await this.prisma!.financial_accounts.delete({
        where: { id },
      });
    } catch (error) {
      if ((error as Error).message === 'Account not found') {
        throw error;
      }
      throw new Error(`Failed to delete account: ${(error as Error).message}`);
    }
  }

  // Financial Account-specific methods
  async getAccountsByUser(userId: number): Promise<FinancialAccountEntity[]> {
    this.ensureConnected();
    
    if (userId <= 0) {
      throw new Error('Invalid user ID');
    }

    try {
      const accounts = await this.prisma!.financial_accounts.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      });
      
      return accounts.map(toFinancialAccountEntity);
    } catch (error) {
      throw new Error(`Failed to get accounts: ${(error as Error).message}`);
    }
  }

  async getAccountById(id: number): Promise<FinancialAccountEntity | null> {
    this.ensureConnected();
    this.parseId(id);

    try {
      const account = await this.prisma!.financial_accounts.findUnique({
        where: { id },
      });

      return account ? toFinancialAccountEntity(account) : null;
    } catch (error) {
      throw new Error(`Failed to get account: ${(error as Error).message}`);
    }
  }

  async getActiveAccountsByUser(userId: number): Promise<FinancialAccountEntity[]> {
    this.ensureConnected();
    
    if (userId <= 0) {
      throw new Error('Invalid user ID');
    }

    try {
      const accounts = await this.prisma!.financial_accounts.findMany({
        where: { 
          user_id: userId,
          is_active: true
        },
        orderBy: { created_at: 'desc' }
      });
      
      return accounts.map(toFinancialAccountEntity);
    } catch (error) {
      throw new Error(`Failed to get active accounts: ${(error as Error).message}`);
    }
  }

  async getAccountSummaryByUser(userId: number): Promise<any> {
    this.ensureConnected();
    
    if (userId <= 0) {
      throw new Error('Invalid user ID');
    }

    try {
      const accounts = await this.prisma!.financial_accounts.findMany({
        where: { user_id: userId }
      });

      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
      const accountsByType = accounts.reduce((acc, account) => {
        acc[account.account_type] = (acc[account.account_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const currencyBreakdown = accounts.reduce((acc, account) => {
        acc[account.currency] = (acc[account.currency] || 0) + Number(account.balance);
        return acc;
      }, {} as Record<string, number>);

      return {
        total_balance: totalBalance,
        accounts_by_type: accountsByType,
        currency_breakdown: currencyBreakdown,
        active_accounts: accounts.filter(a => a.is_active).length,
        total_accounts: accounts.length
      };
    } catch (error) {
      throw new Error(`Failed to get account summary: ${(error as Error).message}`);
    }
  }

  async updateBalance(id: number, balance: number): Promise<FinancialAccountEntity | null> {
    this.ensureConnected();
    this.parseId(id);

    try {
      const existing = await this.prisma!.financial_accounts.findUnique({
        where: { id },
      });

      if (!existing) {
        return null;
      }

      const updated = await this.prisma!.financial_accounts.update({
        where: { id },
        data: {
          balance: new Decimal(balance),
          updated_at: new Date()
        }
      });

      return toFinancialAccountEntity(updated);
    } catch (error) {
      throw new Error(`Failed to update balance: ${(error as Error).message}`);
    }
  }
}

export async function createFinancialAccountRepository(): Promise<IFinancialAccountRepository> {
  const repo = new FinancialAccountRepository();
  await repo.init();
  return repo;
}

// Export the interface for use in other modules
export { IFinancialAccountRepository }; 