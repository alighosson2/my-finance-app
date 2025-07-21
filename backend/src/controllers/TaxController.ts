import { Request, Response } from 'express';
import { TaxService } from '../services/TaxService';
import { CreateTaxRecordRequest, UpdateTaxRecordRequest, FilingStatus } from '../model/TaxModel';
import { AuthRequest } from '../config/types';
import logger from '../util/logger';

export class TaxController {
  private taxService: TaxService;

  constructor() {
    this.taxService = new TaxService();
  }

  // Create new tax record
  createTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const data: CreateTaxRecordRequest = req.body || {};

      // Validate required fields
      if (!data.tax_year || !data.filing_status) {
        res.status(400).json({
          error: 'Missing required fields: tax_year, filing_status'
        });
        return;
      }

      // Validate filing status
      if (!Object.values(FilingStatus).includes(data.filing_status)) {
        res.status(400).json({
          error: 'Invalid filing status. Must be one of: single, married_jointly, married_separately, head_of_household'
        });
        return;
      }

      // Validate tax year
      const currentYear = new Date().getFullYear();
      if (data.tax_year < 2020 || data.tax_year > currentYear + 1) {
        res.status(400).json({
          error: `Tax year must be between 2020 and ${currentYear + 1}`
        });
        return;
      }

      const taxRecord = await this.taxService.createTaxRecord(userId, data);

      logger.info(`Tax record created for user ${userId}, year ${data.tax_year}`);
      
      res.status(201).json({
        message: 'Tax record created successfully',
        data: taxRecord.toJSON()
      });
    } catch (error: any) {
      logger.error('Error creating tax record:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to create tax record',
        details: error.message 
      });
    }
  };

  // Get tax record by ID
  getTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxRecordId = parseInt(req.params.id);

      if (isNaN(taxRecordId)) {
        res.status(400).json({ error: 'Invalid tax record ID' });
        return;
      }

      const taxRecord = await this.taxService.getTaxRecord(userId, taxRecordId);

      if (!taxRecord) {
        res.status(404).json({ error: 'Tax record not found' });
        return;
      }

      res.json({
        message: 'Tax record retrieved successfully',
        data: taxRecord.toJSON()
      });
    } catch (error: any) {
      logger.error('Error getting tax record:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve tax record',
        details: error.message 
      });
    }
  };

  // Get tax record by year
  getTaxRecordByYear = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxYear = parseInt(req.params.year);

      if (isNaN(taxYear)) {
        res.status(400).json({ error: 'Invalid tax year' });
        return;
      }

      const taxRecord = await this.taxService.getTaxRecordByYear(userId, taxYear);

      if (!taxRecord) {
        res.status(404).json({ error: `No tax record found for year ${taxYear}` });
        return;
      }

      res.json({
        message: 'Tax record retrieved successfully',
        data: taxRecord.toJSON()
      });
    } catch (error: any) {
      logger.error('Error getting tax record by year:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve tax record',
        details: error.message 
      });
    }
  };

  // Get all tax records for user
  getAllTaxRecords = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxRecords = await this.taxService.getAllTaxRecords(userId);

      res.json({
        message: 'Tax records retrieved successfully',
        data: taxRecords.map(record => record.toJSON()),
        count: taxRecords.length
      });
    } catch (error: any) {
      logger.error('Error getting all tax records:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve tax records',
        details: error.message 
      });
    }
  };

  // Update tax record
  updateTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxRecordId = parseInt(req.params.id);
      const data: UpdateTaxRecordRequest = req.body;

      if (isNaN(taxRecordId)) {
        res.status(400).json({ error: 'Invalid tax record ID' });
        return;
      }

      // Validate filing status if provided
      if (data.filing_status && !Object.values(FilingStatus).includes(data.filing_status)) {
        res.status(400).json({
          error: 'Invalid filing status'
        });
        return;
      }

      const updatedRecord = await this.taxService.updateTaxRecord(userId, taxRecordId, data);

      if (!updatedRecord) {
        res.status(404).json({ error: 'Tax record not found' });
        return;
      }

      logger.info(`Tax record ${taxRecordId} updated for user ${userId}`);

      res.json({
        message: 'Tax record updated successfully',
        data: updatedRecord.toJSON()
      });
    } catch (error: any) {
      logger.error('Error updating tax record:', error);
      res.status(500).json({ 
        error: 'Failed to update tax record',
        details: error.message 
      });
    }
  };

  // Delete tax record
  deleteTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxRecordId = parseInt(req.params.id);

      if (isNaN(taxRecordId)) {
        res.status(400).json({ error: 'Invalid tax record ID' });
        return;
      }

      const deleted = await this.taxService.deleteTaxRecord(userId, taxRecordId);

      if (!deleted) {
        res.status(404).json({ error: 'Tax record not found' });
        return;
      }

      logger.info(`Tax record ${taxRecordId} deleted for user ${userId}`);

      res.json({
        message: 'Tax record deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting tax record:', error);
      res.status(500).json({ 
        error: 'Failed to delete tax record',
        details: error.message 
      });
    }
  };

  // Calculate tax estimate
  calculateTaxEstimate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const { tax_year, filing_status } = req.body || {};

      if (!tax_year || !filing_status) {
        res.status(400).json({
          error: 'Missing required fields: tax_year, filing_status'
        });
        return;
      }

      if (!Object.values(FilingStatus).includes(filing_status)) {
        res.status(400).json({
          error: 'Invalid filing status'
        });
        return;
      }

      const calculation = await this.taxService.calculateTaxEstimate(userId, tax_year, filing_status);

      logger.info(`Tax calculation completed for user ${userId}, year ${tax_year}`);

      res.json({
        message: 'Tax estimate calculated successfully',
        data: calculation
      });
    } catch (error: any) {
      logger.error('Error calculating tax estimate:', error);
      res.status(500).json({ 
        error: 'Failed to calculate tax estimate',
        details: error.message 
      });
    }
  };

  // Generate tax report
  generateTaxReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxYear = parseInt(req.params.year);

      if (isNaN(taxYear)) {
        res.status(400).json({ error: 'Invalid tax year' });
        return;
      }

      const report = await this.taxService.generateTaxReport(userId, taxYear);

      logger.info(`Tax report generated for user ${userId}, year ${taxYear}`);

      res.json({
        message: 'Tax report generated successfully',
        data: report
      });
    } catch (error: any) {
      logger.error('Error generating tax report:', error);
      
      if (error.message.includes('No tax record found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to generate tax report',
        details: error.message 
      });
    }
  };

  // Refresh tax calculations
  refreshCalculations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxYear = parseInt(req.params.year);

      if (isNaN(taxYear)) {
        res.status(400).json({ error: 'Invalid tax year' });
        return;
      }

      const updatedRecord = await this.taxService.refreshTaxCalculations(userId, taxYear);

      if (!updatedRecord) {
        res.status(404).json({ error: `No tax record found for year ${taxYear}` });
        return;
      }

      logger.info(`Tax calculations refreshed for user ${userId}, year ${taxYear}`);

      res.json({
        message: 'Tax calculations refreshed successfully',
        data: updatedRecord.toJSON()
      });
    } catch (error: any) {
      logger.error('Error refreshing tax calculations:', error);
      res.status(500).json({ 
        error: 'Failed to refresh tax calculations',
        details: error.message 
      });
    }
  };

  // Get available tax years
  getTaxYears = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const taxYears = await this.taxService.getTaxYears(userId);

      res.json({
        message: 'Tax years retrieved successfully',
        data: taxYears,
        count: taxYears.length
      });
    } catch (error: any) {
      logger.error('Error getting tax years:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve tax years',
        details: error.message 
      });
    }
  };
} 