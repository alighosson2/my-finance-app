import { TaxRepository } from '../Repositories/TaxRepository';
import { TransactionService } from './TransactionService';
import { 
  TaxRecordEntity, 
  CreateTaxRecordRequest, 
  UpdateTaxRecordRequest,
  TaxCalculationResult,
  TaxBracketBreakdown,
  TaxableIncomeBreakdown,
  DeductionSummary,
  TaxReport,
  QuarterlyEstimate,
  FilingStatus,
  TaxCategory,
  TAX_BRACKETS_2024_SINGLE,
  TAX_BRACKETS_2024_MARRIED,
  TaxHelpers
} from '../model/TaxModel';
import { TransactionEntity } from '../model/TransactionModel';
import logger from '../util/logger';

export class TaxService {
  private taxRepository: TaxRepository | null = null;
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  private async getRepo(): Promise<TaxRepository> {
    if (!this.taxRepository) {
      this.taxRepository = new TaxRepository();
      await this.taxRepository.init();
    }
    return this.taxRepository;
  }

  // ===== TAX RECORD CRUD =====

  async createTaxRecord(userId: number, data: CreateTaxRecordRequest): Promise<TaxRecordEntity> {
    const repo = await this.getRepo();
    
    // Check if record already exists for this year
    const existing = await repo.getByUserAndYear(userId, data.tax_year);
    if (existing) {
      throw new Error(`Tax record for year ${data.tax_year} already exists`);
    }
    
    const taxRecord = await repo.create(userId, data);
    
    // Calculate taxes based on current transaction data
    await this.calculateAndUpdateTaxes(userId, taxRecord.id, data.tax_year);
    
    // Return updated record with calculations
    return await repo.getById(taxRecord.id, userId) || taxRecord;
  }

  async getTaxRecord(userId: number, taxRecordId: number): Promise<TaxRecordEntity | null> {
    const repo = await this.getRepo();
    return await repo.getById(taxRecordId, userId);
  }

  async getTaxRecordByYear(userId: number, taxYear: number): Promise<TaxRecordEntity | null> {
    const repo = await this.getRepo();
    return await repo.getByUserAndYear(userId, taxYear);
  }

  async getAllTaxRecords(userId: number): Promise<TaxRecordEntity[]> {
    const repo = await this.getRepo();
    return await repo.getByUser(userId);
  }

  async updateTaxRecord(
    userId: number, 
    taxRecordId: number, 
    data: UpdateTaxRecordRequest
  ): Promise<TaxRecordEntity | null> {
    const repo = await this.getRepo();
    
    const updated = await repo.update(taxRecordId, userId, data as any);
    if (!updated) return null;
    
    // Recalculate taxes if filing status changed
    if (data.filing_status) {
      await this.calculateAndUpdateTaxes(userId, taxRecordId, updated.tax_year);
      return await repo.getById(taxRecordId, userId);
    }
    
    return updated;
  }

  async deleteTaxRecord(userId: number, taxRecordId: number): Promise<boolean> {
    const repo = await this.getRepo();
    return await repo.delete(taxRecordId, userId);
  }

  // ===== TAX CALCULATIONS =====

  async calculateTaxEstimate(userId: number, taxYear: number, filingStatus: FilingStatus): Promise<TaxCalculationResult> {
    logger.info(`🧮 Calculating tax estimate for user ${userId}, year ${taxYear}`);
    
    // Get income breakdown from transactions
    const incomeBreakdown = await this.calculateTaxableIncome(userId, taxYear);
    
    // Get deductions
    const deductions = await this.calculateDeductions(userId, taxYear);
    const standardDeduction = TaxHelpers.getStandardDeduction(filingStatus, taxYear);
    const totalDeductions = Math.max(deductions.totalAmount, standardDeduction);
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, incomeBreakdown.totalIncome - totalDeductions);
    
    // Calculate federal tax
    const taxBrackets = this.getTaxBrackets(filingStatus);
    const { federalTax, breakdown } = this.calculateFederalTax(taxableIncome, taxBrackets);
    
    // Calculate rates
    const effectiveRate = incomeBreakdown.totalIncome > 0 ? federalTax / incomeBreakdown.totalIncome : 0;
    const marginalRate = this.getMarginalTaxRate(taxableIncome, taxBrackets);
    
    // Determine tax bracket
    const taxBracket = this.determineTaxBracket(taxableIncome, taxBrackets);
    
    return {
      taxableIncome,
      federalTax,
      effectiveRate: effectiveRate * 100, // Convert to percentage
      marginalRate: marginalRate * 100,
      taxBracket,
      deductions: totalDeductions,
      credits: 0, // TODO: Implement tax credits
      netTax: Math.max(0, federalTax), // After credits
      breakdown
    };
  }

  private async calculateAndUpdateTaxes(userId: number, taxRecordId: number, taxYear: number): Promise<void> {
    const taxRecord = await (await this.getRepo()).getById(taxRecordId, userId);
    if (!taxRecord) return;
    
    const filingStatus = taxRecord.getFilingStatus() || FilingStatus.SINGLE;
    const calculation = await this.calculateTaxEstimate(userId, taxYear, filingStatus);
    
    await (await this.getRepo()).updateCalculations(taxRecordId, userId, {
      taxableIncome: calculation.taxableIncome,
      estimatedTax: calculation.netTax,
      taxBracket: calculation.taxBracket
    });
  }

  // ===== INCOME CALCULATIONS =====

  async calculateTaxableIncome(userId: number, taxYear: number): Promise<TaxableIncomeBreakdown> {
    const startDate = new Date(taxYear, 0, 1); // Jan 1
    const endDate = new Date(taxYear, 11, 31); // Dec 31
    
    // Get all income transactions for the year
    const transactions = await this.transactionService.getTransactionsByUser(userId, 1, 10000);
    const yearTransactions = transactions.transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate && tx.transaction_type === 'income';
    });
    
    let salaryIncome = 0;
    let businessIncome = 0;
    let investmentIncome = 0;
    let otherIncome = 0;
    
    yearTransactions.forEach(tx => {
      const amount = Math.abs(Number(tx.amount));
      const category = tx.category?.toLowerCase() || '';
      const description = tx.description.toLowerCase();
      
      if (category.includes('salary') || category.includes('wage') || description.includes('payroll')) {
        salaryIncome += amount;
      } else if (category.includes('business') || category.includes('freelance')) {
        businessIncome += amount;
      } else if (category.includes('investment') || category.includes('dividend') || category.includes('interest')) {
        investmentIncome += amount;
      } else {
        otherIncome += amount;
      }
    });
    
    const totalIncome = salaryIncome + businessIncome + investmentIncome + otherIncome;
    
    return {
      totalIncome,
      salaryIncome,
      businessIncome,
      investmentIncome,
      otherIncome,
      totalDeductions: 0, // Calculated separately
      standardDeduction: 0, // Set by calling method
      itemizedDeductions: 0, // Set by calling method
      taxableIncome: totalIncome // Before deductions
    };
  }

  // ===== DEDUCTION CALCULATIONS =====

  async calculateDeductions(userId: number, taxYear: number): Promise<{ totalAmount: number; summary: DeductionSummary[] }> {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31);
    
    const transactions = await this.transactionService.getTransactionsByUser(userId, 1, 10000);
    const yearTransactions = transactions.transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate && tx.transaction_type === 'expense';
    });
    
    const deductionMap = new Map<TaxCategory, DeductionSummary>();
    let totalAmount = 0;
    
    yearTransactions.forEach(tx => {
      const category = tx.category || 'Other';
      const amount = Math.abs(Number(tx.amount));
      
      if (TaxHelpers.isDeductibleCategory(category)) {
        const taxCategory = TaxHelpers.mapToTaxCategory(category, tx.description);
        if (taxCategory) {
          const key = taxCategory;
          const existing = deductionMap.get(key) || {
            category: taxCategory,
            description: this.getTaxCategoryDescription(taxCategory),
            amount: 0,
            transactionCount: 0,
            isDeductible: true,
            estimatedSavings: 0
          };
          
          existing.amount += amount;
          existing.transactionCount += 1;
          existing.estimatedSavings = existing.amount * 0.22; // Assume 22% tax bracket
          
          deductionMap.set(key, existing);
          totalAmount += amount;
        }
      }
    });
    
    return {
      totalAmount,
      summary: Array.from(deductionMap.values())
    };
  }

  private getTaxCategoryDescription(category: TaxCategory): string {
    const descriptions: Record<TaxCategory, string> = {
      [TaxCategory.BUSINESS_EXPENSE]: 'Business expenses and supplies',
      [TaxCategory.MEDICAL_EXPENSE]: 'Medical and healthcare expenses',
      [TaxCategory.CHARITABLE_DONATION]: 'Charitable donations and contributions',
      [TaxCategory.HOME_OFFICE]: 'Home office and workspace expenses',
      [TaxCategory.EDUCATION]: 'Education and professional development',
      [TaxCategory.INVESTMENT_LOSS]: 'Investment losses',
      [TaxCategory.RETIREMENT_CONTRIBUTION]: 'Retirement account contributions'
    };
    return descriptions[category] || 'Tax deductible expenses';
  }

  // ===== TAX BRACKET CALCULATIONS =====

  private getTaxBrackets(filingStatus: FilingStatus) {
    switch (filingStatus) {
      case FilingStatus.MARRIED_JOINTLY:
        return TAX_BRACKETS_2024_MARRIED;
      case FilingStatus.SINGLE:
      case FilingStatus.MARRIED_SEPARATELY:
      case FilingStatus.HEAD_OF_HOUSEHOLD:
      default:
        return TAX_BRACKETS_2024_SINGLE;
    }
  }

  private calculateFederalTax(taxableIncome: number, brackets: typeof TAX_BRACKETS_2024_SINGLE): {
    federalTax: number;
    breakdown: TaxBracketBreakdown[];
  } {
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    const breakdown: TaxBracketBreakdown[] = [];
    
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const bracketSize = bracket.max ? bracket.max - bracket.min : remainingIncome;
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      const taxOnBracket = incomeInBracket * bracket.rate;
      
      totalTax += taxOnBracket;
      remainingIncome -= incomeInBracket;
      
      breakdown.push({
        bracket: TaxHelpers.formatPercentage(bracket.rate),
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate,
        incomeInBracket,
        taxOnBracket
      });
      
      if (!bracket.max || remainingIncome <= 0) break;
    }
    
    return { federalTax: totalTax, breakdown };
  }

  private getMarginalTaxRate(taxableIncome: number, brackets: typeof TAX_BRACKETS_2024_SINGLE): number {
    for (const bracket of brackets) {
      if (!bracket.max || taxableIncome <= bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }

  private determineTaxBracket(taxableIncome: number, brackets: typeof TAX_BRACKETS_2024_SINGLE): string {
    for (const bracket of brackets) {
      if (!bracket.max || taxableIncome <= bracket.max) {
        return TaxHelpers.formatPercentage(bracket.rate);
      }
    }
    return TaxHelpers.formatPercentage(brackets[brackets.length - 1].rate);
  }

  // ===== TAX REPORTS =====

  async generateTaxReport(userId: number, taxYear: number): Promise<TaxReport> {
    const taxRecord = await this.getTaxRecordByYear(userId, taxYear);
    if (!taxRecord) {
      throw new Error(`No tax record found for year ${taxYear}`);
    }
    
    const filingStatus = taxRecord.getFilingStatus() || FilingStatus.SINGLE;
    const calculation = await this.calculateTaxEstimate(userId, taxYear, filingStatus);
    const incomeBreakdown = await this.calculateTaxableIncome(userId, taxYear);
    const deductions = await this.calculateDeductions(userId, taxYear);
    const quarterlyEstimates = this.calculateQuarterlyEstimates(calculation.netTax, taxYear);
    
    // Get user info (would normally come from UserService)
    const user = {
      id: userId,
      name: 'Tax User', // TODO: Get from UserService
      email: 'user@example.com' // TODO: Get from UserService
    };
    
    return {
      user,
      taxYear,
      filingStatus,
      calculation,
      incomeBreakdown: {
        ...incomeBreakdown,
        totalDeductions: deductions.totalAmount,
        standardDeduction: TaxHelpers.getStandardDeduction(filingStatus, taxYear),
        itemizedDeductions: deductions.totalAmount,
        taxableIncome: calculation.taxableIncome
      },
      deductions: deductions.summary,
      quarterlyEstimates,
      generatedAt: new Date()
    };
  }

  private calculateQuarterlyEstimates(annualTax: number, year: number): QuarterlyEstimate[] {
    const quarterlyAmount = Math.ceil(annualTax / 4);
    
    return [
      {
        quarter: 'Q1',
        dueDate: new Date(year, 3, 15), // April 15
        estimatedPayment: quarterlyAmount,
        isPaid: false
      },
      {
        quarter: 'Q2',
        dueDate: new Date(year, 5, 15), // June 15
        estimatedPayment: quarterlyAmount,
        isPaid: false
      },
      {
        quarter: 'Q3',
        dueDate: new Date(year, 8, 15), // September 15
        estimatedPayment: quarterlyAmount,
        isPaid: false
      },
      {
        quarter: 'Q4',
        dueDate: new Date(year + 1, 0, 15), // January 15 (next year)
        estimatedPayment: quarterlyAmount,
        isPaid: false
      }
    ];
  }

  // ===== UTILITY METHODS =====

  async refreshTaxCalculations(userId: number, taxYear: number): Promise<TaxRecordEntity | null> {
    const taxRecord = await this.getTaxRecordByYear(userId, taxYear);
    if (!taxRecord) return null;
    
    await this.calculateAndUpdateTaxes(userId, taxRecord.id, taxYear);
    return await this.getTaxRecord(userId, taxRecord.id);
  }

  async getTaxYears(userId: number): Promise<number[]> {
    const repo = await this.getRepo();
    return await repo.getTaxYearsByUser(userId);
  }
} 