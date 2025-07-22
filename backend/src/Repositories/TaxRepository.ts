import { PrismaClient, tax_records } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { TaxRecordEntity, CreateTaxRecordRequest, UpdateTaxRecordRequest } from '../model/TaxModel';

export class TaxRepository {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    if (!this.prisma) {
      this.prisma = await ConnectionManager.getConnection();
      console.info('TaxRepository initialized');
    }
  }

  private async getPrisma(): Promise<PrismaClient> {
    if (!this.prisma) {
      await this.init();
    }
    return this.prisma!;
  }

  // Create new tax record
  async create(userId: number, data: CreateTaxRecordRequest): Promise<TaxRecordEntity> {
    const prisma = await this.getPrisma();

    const taxRecord = await prisma.tax_records.create({
      data: {
        user_id: userId,
        tax_year: data.tax_year,
        taxable_income: 0, // Will be calculated by service
        filing_status: data.filing_status,
        deductions: data.deductions || 0,
        credits: data.credits || 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return this.mapToEntity(taxRecord);
  }

  // Get tax record by ID
  async getById(id: number, userId: number): Promise<TaxRecordEntity | null> {
    const prisma = await this.getPrisma();

    const taxRecord = await prisma.tax_records.findFirst({
      where: {
        id,
        user_id: userId
      }
    });

    return taxRecord ? this.mapToEntity(taxRecord) : null;
  }

  // Get tax record by user and year
  async getByUserAndYear(userId: number, taxYear: number): Promise<TaxRecordEntity | null> {
    const prisma = await this.getPrisma();

    const taxRecord = await prisma.tax_records.findFirst({
      where: {
        user_id: userId,
        tax_year: taxYear
      }
    });

    return taxRecord ? this.mapToEntity(taxRecord) : null;
  }

  // Get all tax records for user
  async getByUser(userId: number): Promise<TaxRecordEntity[]> {
    const prisma = await this.getPrisma();

    const taxRecords = await prisma.tax_records.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        tax_year: 'desc'
      }
    });

    return taxRecords.map(record => this.mapToEntity(record));
  }

  // Update tax record
  async update(id: number, userId: number, data: Partial<tax_records>): Promise<TaxRecordEntity | null> {
    const prisma = await this.getPrisma();

    try {
      const updatedRecord = await prisma.tax_records.update({
        where: {
          id,
          user_id: userId
        },
        data: {
          ...data,
          updated_at: new Date()
        }
      });

      return this.mapToEntity(updatedRecord);
    } catch (error) {
      console.error('Failed to update tax record:', error);
      return null;
    }
  }

  // Update calculated tax values
  async updateCalculations(
    id: number,
    userId: number,
    calculations: {
      taxableIncome: number;
      estimatedTax: number;
      taxBracket: string;
    }
  ): Promise<TaxRecordEntity | null> {
    const prisma = await this.getPrisma();

    try {
      const updatedRecord = await prisma.tax_records.update({
        where: {
          id,
          user_id: userId
        },
        data: {
          taxable_income: calculations.taxableIncome,
          estimated_tax: calculations.estimatedTax,
          tax_bracket: calculations.taxBracket,
          updated_at: new Date()
        }
      });

      return this.mapToEntity(updatedRecord);
    } catch (error) {
      console.error('Failed to update tax calculations:', error);
      return null;
    }
  }

  // Delete tax record
  async delete(id: number, userId: number): Promise<boolean> {
    const prisma = await this.getPrisma();

    try {
      await prisma.tax_records.delete({
        where: {
          id,
          user_id: userId
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete tax record:', error);
      return false;
    }
  }

  // Check if tax record exists for user and year
  async existsByUserAndYear(userId: number, taxYear: number): Promise<boolean> {
    const prisma = await this.getPrisma();

    const count = await prisma.tax_records.count({
      where: {
        user_id: userId,
        tax_year: taxYear
      }
    });

    return count > 0;
  }

  // Get tax years for user
  async getTaxYearsByUser(userId: number): Promise<number[]> {
    const prisma = await this.getPrisma();

    const results = await prisma.tax_records.findMany({
      where: {
        user_id: userId
      },
      select: {
        tax_year: true
      },
      distinct: ['tax_year'],
      orderBy: {
        tax_year: 'desc'
      }
    });

    return results.map(r => r.tax_year);
  }

  // Private helper to map Prisma record to Entity
  private mapToEntity(record: tax_records): TaxRecordEntity {
    return new TaxRecordEntity(
      record.id,
      record.user_id,
      record.tax_year,
      Number(record.taxable_income),
      record.estimated_tax ? Number(record.estimated_tax) : null,
      record.tax_bracket,
      record.filing_status,
      record.deductions ? Number(record.deductions) : null,
      record.credits ? Number(record.credits) : null,
      record.created_at,
      record.updated_at
    );
  }
}
