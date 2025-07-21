import { PrismaClient } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { IRepository } from './IRepository';
import { FinancialAccountModel, CreateFinancialAccountDTO, UpdateFinancialAccountDTO } from '../model/FinancialAccountModel';

export class FinancialAccountRepository implements IRepository<FinancialAccountModel> {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    this.prisma = await ConnectionManager.getConnection();
  }

  private ensureConnection(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Repository not initialized. Call init() first.');
    }
    return this.prisma;
  }

  async create(data: CreateFinancialAccountDTO): Promise<any> {
    const prisma = this.ensureConnection();
    
    const result = await prisma.financial_accounts.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      } as any,
    });

    return result;
  }

  async findById(id: number): Promise<any> {
    const prisma = this.ensureConnection();
    
    return await prisma.financial_accounts.findUnique({
      where: { id } as any,
    });
  }

  // Required by IRepository interface
  async get(id: number): Promise<any> {
    return this.findById(id);
  }

  async getAll(): Promise<any[]> {
    const prisma = this.ensureConnection();
    
    return await prisma.financial_accounts.findMany();
  }

  async findMany(options?: any): Promise<any[]> {
    const prisma = this.ensureConnection();
    
    return await prisma.financial_accounts.findMany(options || {});
  }

  async update(id: number, data: UpdateFinancialAccountDTO): Promise<any> {
    const prisma = this.ensureConnection();
    
    return await prisma.financial_accounts.update({
        where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      } as any,
      });
      }

  async delete(id: number): Promise<void> {
    const prisma = this.ensureConnection();
    
    await prisma.financial_accounts.delete({
        where: { id },
      });
  }

  async count(where?: any): Promise<number> {
    const prisma = this.ensureConnection();
    
    return await prisma.financial_accounts.count({ where: where || {} });
  }

  async findByUserId(userId: number, page = 1, limit = 10): Promise<{ accounts: any[]; total: number }> {
    const prisma = this.ensureConnection();
    
    const [accounts, total] = await Promise.all([
      prisma.financial_accounts.findMany({
        where: { user_id: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.financial_accounts.count({
        where: { user_id: userId },
      }),
    ]);

    return { accounts, total };
  }

  async findByExternalAccountId(externalAccountId: string): Promise<any> {
    const prisma = this.ensureConnection();
    
    // Use raw query to avoid Prisma type issues with custom fields
    return await prisma.$queryRaw`
      SELECT * FROM financial_accounts 
      WHERE external_account_id = ${externalAccountId} 
      LIMIT 1
    `;
  }

  async updateSyncStatus(accountId: number, syncData: { last_synced_at: Date }): Promise<void> {
    const prisma = this.ensureConnection();
    
    // Use raw query for custom fields
    await prisma.$executeRaw`
      UPDATE financial_accounts 
      SET last_synced_at = ${syncData.last_synced_at}, updated_at = NOW()
      WHERE id = ${accountId}
    `;
  }

  async getUserAccountSummary(userId: number): Promise<any> {
    const prisma = this.ensureConnection();
    
    const accounts = await prisma.financial_accounts.findMany({
      where: { user_id: userId, is_active: true },
    });

    return {
      total_accounts: accounts.length,
      total_balance: accounts.reduce((sum: number, acc: any) => sum + (parseFloat(acc.balance?.toString() || '0') || 0), 0),
      accounts_by_type: accounts.reduce((acc: any, account: any) => {
        const type = account.account_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

// Factory function to create and initialize the repository
export async function createFinancialAccountRepository(): Promise<FinancialAccountRepository> {
  const repository = new FinancialAccountRepository();
  await repository.init();
  return repository;
} 