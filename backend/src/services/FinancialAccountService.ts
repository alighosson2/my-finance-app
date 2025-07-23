import {
  FinancialAccountModel,
  CreateFinancialAccountDTO,
  UpdateFinancialAccountDTO,
  FinancialAccountSummary
} from '../model/FinancialAccountModel';
import { FinancialAccountRepository, createFinancialAccountRepository } from '../Repositories/FinancialAccountRepository';
import { ServiceException } from '../exceptions/ServiceException';

export class FinancialAccountService {
  private repository: FinancialAccountRepository | null = null;

  private async getRepo(): Promise<FinancialAccountRepository> {
    if (!this.repository) {
      this.repository = await createFinancialAccountRepository();
    }
    return this.repository;
  }

  async getAllAccounts(userId: number, page = 1, limit = 10): Promise<{
    accounts: FinancialAccountModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const repository = await this.getRepo();
      const offset = (page - 1) * limit;

      const result = await repository.findByUserId(userId, page, limit);
      const { accounts, total } = result;

      return {
        accounts,
        total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new ServiceException(`Failed to get accounts: ${error.message}`);
    }
  }

  async getAccountById(id: number, userId: number): Promise<FinancialAccountModel> {
    try {
      const repository = await this.getRepo();
      const account = await repository.findById(id);

      if (!account) {
        throw new ServiceException('Account not found');
      }

      // Ensure user owns this account
      if (account.user_id !== userId) {
        throw new ServiceException('Access denied');
      }

      return account;
    } catch (error: any) {
      throw new ServiceException(`Failed to get account: ${error.message}`);
    }
  }

  async createAccount(data: CreateFinancialAccountDTO): Promise<FinancialAccountModel> {
    try {
      // Validate required fields
      if (!data.account_name || !data.account_type) {
        throw new ServiceException('Account name and type are required');
      }

      // Validate balance
      if (data.balance < 0) {
        throw new ServiceException('Balance cannot be negative');
      }

      const repository = await this.getRepo();
      return await repository.create(data);
    } catch (error: any) {
      throw new ServiceException(`Failed to create account: ${error.message}`);
    }
  }

  async updateAccount(id: number, data: UpdateFinancialAccountDTO, userId: number): Promise<FinancialAccountModel> {
    try {
      const repository = await this.getRepo();

      // Check if account exists and user owns it
      const existingAccount = await repository.findById(id);
      if (!existingAccount || existingAccount.user_id !== userId) {
        throw new ServiceException('Account not found or access denied');
      }

      // Validate balance if provided
      if (data.balance !== undefined && data.balance < 0) {
        throw new ServiceException('Balance cannot be negative');
      }

      const updatedAccount = await repository.update(id, data);
      if (!updatedAccount) {
        throw new ServiceException('Failed to update account');
      }

      return updatedAccount;
    } catch (error: any) {
      throw new ServiceException(`Failed to update account: ${error.message}`);
    }
  }

  async deleteAccount(id: number, userId: number): Promise<boolean> {
    try {
      const repository = await this.getRepo();

      // Check if account exists and user owns it
      const existingAccount = await repository.findById(id);
      if (!existingAccount || existingAccount.user_id !== userId) {
        throw new ServiceException('Account not found or access denied');
      }

      await repository.delete(id);
      return true;
    } catch (error: any) {
      throw new ServiceException(`Failed to delete account: ${error.message}`);
    }
  }

  async getAccountSummary(userId: number): Promise<FinancialAccountSummary> {
    try {
      const repository = await this.getRepo();
      return await repository.getUserAccountSummary(userId);
    } catch (error: any) {
      throw new ServiceException(`Failed to get account summary: ${error.message}`);
    }
  }

  // OBP-specific methods
  async findByExternalAccountId(externalAccountId: string): Promise<FinancialAccountModel | null> {
    try {
      const repository = await this.getRepo();
      return await repository.findByExternalAccountId(externalAccountId);
    } catch (error: any) {
      throw new ServiceException(`Failed to find account by external ID: ${error.message}`);
  }
  }

  async updateSyncStatus(accountId: number, syncData: { last_synced_at: Date }): Promise<void> {
    try {
      const repository = await this.getRepo();
      await repository.updateSyncStatus(accountId, syncData);
    } catch (error: any) {
      throw new ServiceException(`Failed to update sync status: ${error.message}`);
    }
  }
}
