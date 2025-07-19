import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ServiceException } from '../exceptions/ServiceException';
import { TransactionSearchFilters, TransactionType } from '../model/TransactionModel';
import { AuthRequest } from '../config/types';
import logger from '../util/logger';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    logger.info('📋 getAllTransactions method called');
    try {
      const transactions = await this.transactionService.getAllTransactions();
      res.status(200).json(transactions);
    } catch (error: any) {
      logger.error('Error fetching all transactions - Full error:', error);
      throw new ServiceException(`Error fetching transactions: ${error.message}`);
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    logger.info('🔎 getTransactionById method called');
    try {
      const id = req.params.id;
      if (isNaN(Number(id))) {
        throw new BadRequestException('Invalid transaction ID');
      }
      const transaction = await this.transactionService.getTransactionById(Number(id));
      res.status(200).json(transaction);
    } catch (error: any) {
      if (error.message === 'Transaction not found') {
        throw new NotFoundException('Transaction not found');
      }
      logger.error('Error fetching transaction by ID - Full error:', error);
      throw new ServiceException(`Error fetching transaction: ${error.message}`);
    }
  }

  async getTransactionsByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) throw new BadRequestException('Invalid user ID');

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      if (page < 1) throw new BadRequestException('Page must be greater than 0');
      if (limit < 1 || limit > 100) throw new BadRequestException('Limit must be between 1 and 100');

      const result = await this.transactionService.getTransactionsByUser(userId, page, limit);
      
      res.status(200).json({
        data: result.transactions,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new ServiceException('Error fetching user transactions');
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).user_id || req.body.user_id;
      if (!userId) throw new BadRequestException('User ID is required');

      const { 
        account_id, 
        amount, 
        transaction_date, 
        description, 
        category, 
        subcategory,
        transaction_type: transactionType,
        merchant_name,
        location,
        is_recurring,
        tags,
        budget_id,
        group_budget_id
      } = req.body;

      // Validate required fields
      if (!account_id || !amount || !description || !transactionType) {
        throw new BadRequestException('Account ID, amount, description, and transaction type are required');
      }

      // Validate transaction type
      if (!Object.values(TransactionType).includes(transactionType)) {
        throw new BadRequestException('Invalid transaction type. Must be income, expense, or transfer');
      }

      // Validate amount
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new BadRequestException('Amount must be a positive number');
      }

      const transactionData = {
        account_id: Number(account_id),
        amount: Number(amount),
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        description: description.trim(),
        category: category?.trim() || undefined,
        subcategory: subcategory?.trim() || undefined,
        transaction_type: transactionType,
        merchant_name: merchant_name?.trim() || undefined,
        location: location?.trim() || undefined,
        is_recurring: Boolean(is_recurring),
        tags: Array.isArray(tags) ? tags : [],
        budget_id: budget_id ? Number(budget_id) : undefined,
        group_budget_id: group_budget_id ? Number(group_budget_id) : undefined
      };

      const newTransaction = await this.transactionService.createTransaction(userId, transactionData);
      res.status(201).json(newTransaction);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      logger.error('Error creating transaction', error);
      throw new ServiceException('Error creating transaction');
    }
  }

  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionId = Number(req.params.id);
      const userId = (req as AuthRequest).user_id;
      
      if (isNaN(transactionId)) throw new BadRequestException('Invalid transaction ID');
      if (!userId) throw new BadRequestException('User authentication required');

      const updateData: any = {};
      
      // Only update fields that are provided
      if (req.body.account_id !== undefined) updateData.account_id = Number(req.body.account_id);
      if (req.body.amount !== undefined) updateData.amount = Number(req.body.amount);
      if (req.body.transaction_date !== undefined) updateData.transaction_date = new Date(req.body.transaction_date);
      if (req.body.description !== undefined) updateData.description = req.body.description.trim();
      if (req.body.category !== undefined) updateData.category = req.body.category?.trim() || null;
      if (req.body.subcategory !== undefined) updateData.subcategory = req.body.subcategory?.trim() || null;
      if (req.body.transaction_type !== undefined) updateData.transaction_type = req.body.transaction_type;
      if (req.body.merchant_name !== undefined) updateData.merchant_name = req.body.merchant_name?.trim() || null;
      if (req.body.location !== undefined) updateData.location = req.body.location?.trim() || null;
      if (req.body.is_recurring !== undefined) updateData.is_recurring = Boolean(req.body.is_recurring);
      if (req.body.tags !== undefined) updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];

      const updated = await this.transactionService.updateTransaction(transactionId, userId, updateData);
      res.status(200).json(updated);
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      logger.error('Error updating transaction', error);
      throw new ServiceException('Error updating transaction');
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionId = Number(req.params.id);
      const userId = (req as AuthRequest).user_id;
      
      if (isNaN(transactionId)) throw new BadRequestException('Invalid transaction ID');
      if (!userId) throw new BadRequestException('User authentication required');

      await this.transactionService.deleteTransaction(transactionId, userId);
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      logger.error('Error deleting transaction', error);
      throw new ServiceException('Error deleting transaction');
    }
  }

  async searchTransactions(req: Request, res: Response): Promise<void> {
    logger.info('🔍 searchTransactions method called');
    try {
      const userId = (req as AuthRequest).user_id || Number(req.query.user_id);
      logger.info(`Search - Raw request user_id: ${userId}, type: ${typeof userId}`);
      
      if (!userId) throw new BadRequestException('User ID is required');

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      // Build search filters
      const filters: TransactionSearchFilters = {};
      
      if (req.query.account_id) filters.account_id = Number(req.query.account_id);
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.subcategory) filters.subcategory = req.query.subcategory as string;
      if (req.query.transaction_type) filters.transaction_type = req.query.transaction_type as any;
      if (req.query.merchant_name) filters.merchant_name = req.query.merchant_name as string;
      
      // Date range filters
      if (req.query.date_from) filters.date_from = new Date(req.query.date_from as string);
      if (req.query.date_to) filters.date_to = new Date(req.query.date_to as string);
      
      // Amount range filters
      if (req.query.amount_min) filters.amount_min = Number(req.query.amount_min);
      if (req.query.amount_max) filters.amount_max = Number(req.query.amount_max);
      
      // Recurring filter
      if (req.query.is_recurring !== undefined) filters.is_recurring = req.query.is_recurring === 'true';
      
      // Tags filter
      if (req.query.tags) {
        const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
        filters.tags = tags as string[];
      }
      
      logger.info(`Searching transactions for user ${userId} with filters:`, filters);
      
      const result = await this.transactionService.searchTransactions(userId, filters, page, limit);
      
      res.status(200).json({
        data: result.transactions,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
          totalPages: result.totalPages
        },
        filters: filters
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      logger.error('Error searching transactions - Full error:', error);
      logger.error('Error stack:', error.stack);
      throw new ServiceException(`Error searching transactions: ${error.message}`);
    }
  }

  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    logger.info('🎯 getDashboardSummary method called');
    try {
      const userId = (req as AuthRequest).user_id;
      logger.info(`Raw request user_id: ${userId}, type: ${typeof userId}`);
      
      if (!userId) throw new BadRequestException('User authentication required');

      logger.info(`Fetching dashboard summary for user ${userId}`);
      const dashboard = await this.transactionService.getDashboardSummary(userId);
      res.status(200).json(dashboard);
    } catch (error: any) {
      logger.error('Error fetching dashboard summary - Full error:', error);
      logger.error('Error stack:', error.stack);
      throw new ServiceException(`Error fetching dashboard summary: ${error.message}`);
    }
  }
} 