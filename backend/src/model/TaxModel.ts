import { tax_records, users } from '@prisma/client';

// ===== TAX BRACKETS & CONSTANTS =====

export interface TaxBracket {
  min: number;
  max: number | null; // null for highest bracket
  rate: number; // percentage as decimal (0.22 for 22%)
}

// 2024 US Federal Tax Brackets (Single)
export const TAX_BRACKETS_2024_SINGLE: TaxBracket[] = [
  { min: 0, max: 11000, rate: 0.10 },
  { min: 11000, max: 44725, rate: 0.12 },
  { min: 44725, max: 95375, rate: 0.22 },
  { min: 95375, max: 182050, rate: 0.24 },
  { min: 182050, max: 231250, rate: 0.32 },
  { min: 231250, max: 578125, rate: 0.35 },
  { min: 578125, max: null, rate: 0.37 }
];

// 2024 US Federal Tax Brackets (Married Filing Jointly)
export const TAX_BRACKETS_2024_MARRIED: TaxBracket[] = [
  { min: 0, max: 22000, rate: 0.10 },
  { min: 22000, max: 89450, rate: 0.12 },
  { min: 89450, max: 190750, rate: 0.22 },
  { min: 190750, max: 364200, rate: 0.24 },
  { min: 364200, max: 462500, rate: 0.32 },
  { min: 462500, max: 693750, rate: 0.35 },
  { min: 693750, max: null, rate: 0.37 }
];

export enum FilingStatus {
  SINGLE = 'single',
  MARRIED_JOINTLY = 'married_jointly',
  MARRIED_SEPARATELY = 'married_separately',
  HEAD_OF_HOUSEHOLD = 'head_of_household'
}

export enum TaxCategory {
  BUSINESS_EXPENSE = 'business_expense',
  MEDICAL_EXPENSE = 'medical_expense',
  CHARITABLE_DONATION = 'charitable_donation',
  HOME_OFFICE = 'home_office',
  EDUCATION = 'education',
  INVESTMENT_LOSS = 'investment_loss',
  RETIREMENT_CONTRIBUTION = 'retirement_contribution'
}

// ===== TAX RECORD INTERFACES =====

export interface ITaxRecord {
  id: number;
  user_id: number;
  tax_year: number;
  taxable_income: number;
  estimated_tax: number | null;
  tax_bracket: string | null;
  filing_status: string | null;
  deductions: number | null;
  credits: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  // Relationships
  user?: users;
}

export interface CreateTaxRecordRequest {
  tax_year: number;
  filing_status: FilingStatus;
  deductions?: number;
  credits?: number;
}

export interface UpdateTaxRecordRequest {
  filing_status?: FilingStatus;
  deductions?: number;
  credits?: number;
  estimated_tax?: number;
  tax_bracket?: string;
}

// ===== TAX CALCULATION RESULTS =====

export interface TaxCalculationResult {
  taxableIncome: number;
  federalTax: number;
  effectiveRate: number; // percentage
  marginalRate: number; // percentage  
  taxBracket: string;
  deductions: number;
  credits: number;
  netTax: number; // after credits
  breakdown: TaxBracketBreakdown[];
}

export interface TaxBracketBreakdown {
  bracket: string; // "10%", "12%", etc.
  min: number;
  max: number | null;
  rate: number;
  incomeInBracket: number;
  taxOnBracket: number;
}

// ===== DEDUCTION TRACKING =====

export interface DeductionSummary {
  category: TaxCategory;
  description: string;
  amount: number;
  transactionCount: number;
  isDeductible: boolean;
  estimatedSavings: number; // tax savings from deduction
}

export interface TaxableIncomeBreakdown {
  totalIncome: number;
  salaryIncome: number;
  businessIncome: number;
  investmentIncome: number;
  otherIncome: number;
  totalDeductions: number;
  standardDeduction: number;
  itemizedDeductions: number;
  taxableIncome: number;
}

// ===== TAX EXPORT/REPORT FORMATS =====

export interface TaxReport {
  user: {
    id: number;
    name: string;
    email: string;
  };
  taxYear: number;
  filingStatus: FilingStatus;
  calculation: TaxCalculationResult;
  incomeBreakdown: TaxableIncomeBreakdown;
  deductions: DeductionSummary[];
  quarterlyEstimates: QuarterlyEstimate[];
  generatedAt: Date;
}

export interface QuarterlyEstimate {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dueDate: Date;
  estimatedPayment: number;
  isPaid: boolean;
}

// ===== TAX ENTITY CLASS =====

export class TaxRecordEntity implements ITaxRecord {
  constructor(
    public id: number,
    public user_id: number,
    public tax_year: number,
    public taxable_income: number,
    public estimated_tax: number | null = null,
    public tax_bracket: string | null = null,
    public filing_status: string | null = null,
    public deductions: number | null = null,
    public credits: number | null = null,
    public created_at: Date | null = null,
    public updated_at: Date | null = null
  ) {}

  // Calculate effective tax rate
  getEffectiveRate(): number {
    if (!this.estimated_tax || this.taxable_income <= 0) return 0;
    return (this.estimated_tax / this.taxable_income) * 100;
  }

  // Get filing status as enum
  getFilingStatus(): FilingStatus | null {
    if (!this.filing_status) return null;
    return this.filing_status as FilingStatus;
  }

  // Check if tax estimate is current year
  isCurrentYear(): boolean {
    return this.tax_year === new Date().getFullYear();
  }

  // Format for JSON response
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      tax_year: this.tax_year,
      taxable_income: parseFloat(this.taxable_income.toString()),
      estimated_tax: this.estimated_tax ? parseFloat(this.estimated_tax.toString()) : null,
      tax_bracket: this.tax_bracket,
      filing_status: this.filing_status,
      deductions: this.deductions ? parseFloat(this.deductions.toString()) : null,
      credits: this.credits ? parseFloat(this.credits.toString()) : null,
      effective_rate: this.getEffectiveRate(),
      is_current_year: this.isCurrentYear(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

// ===== TAX HELPERS =====

export class TaxHelpers {
  // Get standard deduction for filing status and year
  static getStandardDeduction(filingStatus: FilingStatus, year: number): number {
    // 2024 standard deductions
    if (year === 2024) {
      switch (filingStatus) {
        case FilingStatus.SINGLE:
          return 14600;
        case FilingStatus.MARRIED_JOINTLY:
          return 29200;
        case FilingStatus.MARRIED_SEPARATELY:
          return 14600;
        case FilingStatus.HEAD_OF_HOUSEHOLD:
          return 21900;
        default:
          return 14600;
      }
    }
    // Default to 2024 values for other years (would need year-specific logic)
    return TaxHelpers.getStandardDeduction(filingStatus, 2024);
  }

  // Determine if transaction category is tax deductible
  static isDeductibleCategory(category: string): boolean {
    const deductibleCategories = [
      'Business Expense',
      'Medical',
      'Healthcare', 
      'Charity',
      'Donations',
      'Education',
      'Home Office',
      'Professional Development',
      'Investment',
      'Retirement'
    ];
    
    return deductibleCategories.some(deductible => 
      category.toLowerCase().includes(deductible.toLowerCase())
    );
  }

  // Map transaction category to tax category
  static mapToTaxCategory(category: string, description: string): TaxCategory | null {
    const categoryLower = category.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (categoryLower.includes('business') || descLower.includes('business')) {
      return TaxCategory.BUSINESS_EXPENSE;
    }
    if (categoryLower.includes('medical') || categoryLower.includes('healthcare')) {
      return TaxCategory.MEDICAL_EXPENSE;
    }
    if (categoryLower.includes('charity') || categoryLower.includes('donation')) {
      return TaxCategory.CHARITABLE_DONATION;
    }
    if (descLower.includes('home office') || descLower.includes('office')) {
      return TaxCategory.HOME_OFFICE;
    }
    if (categoryLower.includes('education') || descLower.includes('tuition')) {
      return TaxCategory.EDUCATION;
    }
    if (categoryLower.includes('retirement') || descLower.includes('401k') || descLower.includes('ira')) {
      return TaxCategory.RETIREMENT_CONTRIBUTION;
    }
    if (categoryLower.includes('investment') && descLower.includes('loss')) {
      return TaxCategory.INVESTMENT_LOSS;
    }
    
    return null;
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format percentage for display  
  static formatPercentage(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }
} 