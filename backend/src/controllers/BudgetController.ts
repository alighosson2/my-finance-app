import { Request, Response } from 'express';
import { BudgetService } from '../services/BudgetService';
import { CreateBudgetRequest, UpdateBudgetRequest, BudgetSearchFilters, BudgetPeriod, BudgetCategory } from '../model/BudgetModel';
import { AuthRequest } from '../config/types';
import logger from '../util/logger';

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  // Create new budget
  createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const data: CreateBudgetRequest = req.body || {};

      // Validate required fields
      if (!data.name || !data.category || !data.amount || !data.period || !data.start_date) {
        res.status(400).json({
          error: 'Missing required fields: name, category, amount, period, start_date'
        });
        return;
      }

      // Validate amount
      if (data.amount <= 0) {
        res.status(400).json({
          error: 'Budget amount must be greater than 0'
        });
        return;
      }

      // Validate period
      if (!Object.values(BudgetPeriod).includes(data.period)) {
        res.status(400).json({
          error: 'Invalid period. Must be one of: weekly, monthly, quarterly, yearly'
        });
        return;
      }

      // Validate category
      if (!Object.values(BudgetCategory).includes(data.category)) {
        res.status(400).json({
          error: 'Invalid category'
        });
        return;
      }

      // Convert start_date string to Date
      data.start_date = new Date(data.start_date);
      if (data.end_date) {
        data.end_date = new Date(data.end_date);
      }

      const budget = await this.budgetService.createBudget(userId, data);

      logger.info(`Budget created: ${data.name} for user ${userId}`);
      
      res.status(201).json({
        message: 'Budget created successfully',
        data: budget.toJSON()
      });
    } catch (error: any) {
      logger.error('Error creating budget:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to create budget',
        details: error.message 
      });
    }
  };

  // Get budget by ID
  getBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgetId = parseInt(req.params.id);

      if (isNaN(budgetId)) {
        res.status(400).json({ error: 'Invalid budget ID' });
        return;
      }

      const budget = await this.budgetService.getBudget(userId, budgetId);

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.json({
        message: 'Budget retrieved successfully',
        data: budget.toJSON()
      });
    } catch (error: any) {
      logger.error('Error getting budget:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve budget',
        details: error.message 
      });
    }
  };

  // Get all budgets for user
  getAllBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Build filters from query parameters
      const filters: BudgetSearchFilters = {};
      
      if (req.query.category) {
        filters.category = req.query.category as BudgetCategory;
      }
      if (req.query.period) {
        filters.period = req.query.period as BudgetPeriod;
      }
      if (req.query.is_active !== undefined) {
        filters.isActive = req.query.is_active === 'true';
      }
      if (req.query.start_date) {
        filters.startDate = new Date(req.query.start_date as string);
      }
      if (req.query.end_date) {
        filters.endDate = new Date(req.query.end_date as string);
      }
      if (req.query.amount_min) {
        filters.amountMin = parseFloat(req.query.amount_min as string);
      }
      if (req.query.amount_max) {
        filters.amountMax = parseFloat(req.query.amount_max as string);
      }

      const result = await this.budgetService.getAllBudgets(userId, page, limit, filters);

      res.json({
        message: 'Budgets retrieved successfully',
        data: result.budgets.map(budget => budget.toJSON()),
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (error: any) {
      logger.error('Error getting all budgets:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve budgets',
        details: error.message 
      });
    }
  };

  // Get active budgets
  getActiveBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgets = await this.budgetService.getActiveBudgets(userId);

      res.json({
        message: 'Active budgets retrieved successfully',
        data: budgets.map(budget => budget.toJSON()),
        count: budgets.length
      });
    } catch (error: any) {
      logger.error('Error getting active budgets:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve active budgets',
        details: error.message 
      });
    }
  };

  // Update budget
  updateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgetId = parseInt(req.params.id);
      const data: UpdateBudgetRequest = req.body || {};

      if (isNaN(budgetId)) {
        res.status(400).json({ error: 'Invalid budget ID' });
        return;
      }

      // Validate fields if provided
      if (data.amount !== undefined && data.amount <= 0) {
        res.status(400).json({ error: 'Budget amount must be greater than 0' });
        return;
      }

      if (data.period && !Object.values(BudgetPeriod).includes(data.period)) {
        res.status(400).json({ error: 'Invalid period' });
        return;
      }

      if (data.category && !Object.values(BudgetCategory).includes(data.category)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      // Convert date strings to Date objects
      if (data.start_date) {
        data.start_date = new Date(data.start_date);
      }
      if (data.end_date) {
        data.end_date = new Date(data.end_date);
      }

      const updatedBudget = await this.budgetService.updateBudget(userId, budgetId, data);

      if (!updatedBudget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      logger.info(`Budget ${budgetId} updated for user ${userId}`);

      res.json({
        message: 'Budget updated successfully',
        data: updatedBudget.toJSON()
      });
    } catch (error: any) {
      logger.error('Error updating budget:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to update budget',
        details: error.message 
      });
    }
  };

  // Delete budget
  deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgetId = parseInt(req.params.id);

      if (isNaN(budgetId)) {
        res.status(400).json({ error: 'Invalid budget ID' });
        return;
      }

      const deleted = await this.budgetService.deleteBudget(userId, budgetId);

      if (!deleted) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      logger.info(`Budget ${budgetId} deleted for user ${userId}`);

      res.json({
        message: 'Budget deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting budget:', error);
      res.status(500).json({ 
        error: 'Failed to delete budget',
        details: error.message 
      });
    }
  };

  // Deactivate budget
  deactivateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgetId = parseInt(req.params.id);

      if (isNaN(budgetId)) {
        res.status(400).json({ error: 'Invalid budget ID' });
        return;
      }

      const deactivatedBudget = await this.budgetService.deactivateBudget(userId, budgetId);

      if (!deactivatedBudget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      logger.info(`Budget ${budgetId} deactivated for user ${userId}`);

      res.json({
        message: 'Budget deactivated successfully',
        data: deactivatedBudget.toJSON()
      });
    } catch (error: any) {
      logger.error('Error deactivating budget:', error);
      res.status(500).json({ 
        error: 'Failed to deactivate budget',
        details: error.message 
      });
    }
  };

  // Get budget spending analysis
  getBudgetSpending = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const budgetId = parseInt(req.params.id);

      if (isNaN(budgetId)) {
        res.status(400).json({ error: 'Invalid budget ID' });
        return;
      }

      const spending = await this.budgetService.getBudgetSpending(userId, budgetId);

      res.json({
        message: 'Budget spending retrieved successfully',
        data: spending
      });
    } catch (error: any) {
      logger.error('Error getting budget spending:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to retrieve budget spending',
        details: error.message 
      });
    }
  };

  // Get budget summary
  getBudgetSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const summary = await this.budgetService.getBudgetSummary(userId);

      res.json({
        message: 'Budget summary retrieved successfully',
        data: summary
      });
    } catch (error: any) {
      logger.error('Error getting budget summary:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve budget summary',
        details: error.message 
      });
    }
  };

  // Get budget alerts
  getBudgetAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const alerts = await this.budgetService.getBudgetAlerts(userId);

      res.json({
        message: 'Budget alerts retrieved successfully',
        data: alerts,
        count: alerts.length
      });
    } catch (error: any) {
      logger.error('Error getting budget alerts:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve budget alerts',
        details: error.message 
      });
    }
  };

  // Get budget categories
  getBudgetCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const categories = await this.budgetService.getBudgetCategories();

      res.json({
        message: 'Budget categories retrieved successfully',
        data: categories
      });
    } catch (error: any) {
      logger.error('Error getting budget categories:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve budget categories',
        details: error.message 
      });
    }
  };

  // Get spending by category
  getSpendingByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const startDate = new Date(req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(req.query.end_date as string || new Date());
      const category = req.query.category as string;

      const spending = await this.budgetService.getSpendingByCategory(userId, startDate, endDate, category);

      res.json({
        message: 'Spending by category retrieved successfully',
        data: spending,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      });
    } catch (error: any) {
      logger.error('Error getting spending by category:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve spending by category',
        details: error.message 
      });
    }
  };

  // Auto-assign transactions to budgets
  autoAssignTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const assignedCount = await this.budgetService.autoAssignTransactionsToBudgets(userId);

      res.json({
        message: 'Transactions auto-assigned to budgets',
        data: {
          assigned_count: assignedCount
        }
      });
    } catch (error: any) {
      logger.error('Error auto-assigning transactions:', error);
      res.status(500).json({ 
        error: 'Failed to auto-assign transactions',
        details: error.message 
      });
    }
  };

  // Get budget recommendations
  getBudgetRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id!;
      const recommendations = await this.budgetService.generateBudgetRecommendations(userId);

      res.json({
        message: 'Budget recommendations generated successfully',
        data: recommendations
      });
    } catch (error: any) {
      logger.error('Error getting budget recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to generate budget recommendations',
        details: error.message 
      });
    }
  };
} 