import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { CreateTransactionRequest, UpdateTransactionRequest, TransactionSearchFilters } from '../model/TransactionModel';
import { AuthRequest } from '../config/types';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  // Get all transactions for the authenticated user
  getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    try {
      const result = await this.transactionService.getTransactionsByUser(userId, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get transactions by account
  getTransactionsByAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    const accountId = parseInt(req.params.accountId);
    const userId = req.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    try {
      // TODO: Add ownership verification - ensure account belongs to user
      const result = await this.transactionService.getTransactionsByAccount(accountId, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get single transaction by ID
  getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
    const transactionId = parseInt(req.params.id);
    const userId = req.user_id;

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    try {
      const transaction = await this.transactionService.getTransactionById(transactionId);
      
      // Verify transaction belongs to the user
      if (transaction.user_id !== userId) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(200).json(transaction.toJSON());
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Transaction not found' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  // Create new transaction
  createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;
    const data: CreateTransactionRequest = req.body;

    try {
      const transaction = await this.transactionService.createTransaction(userId, data);
      res.status(201).json(transaction.toJSON());
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  // Update transaction
  updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    const transactionId = parseInt(req.params.id);
    const userId = req.user_id;
    const data: UpdateTransactionRequest = req.body;

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    try {
      const transaction = await this.transactionService.updateTransaction(transactionId, userId, data);
      res.status(200).json(transaction.toJSON());
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Transaction not found' });
      } else if (error.message.includes('Invalid')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  // Delete transaction
  deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    const transactionId = parseInt(req.params.id);
    const userId = req.user_id;

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    try {
      await this.transactionService.deleteTransaction(transactionId, userId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Transaction not found' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  // Search transactions with filters
  searchTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;
    const filters: TransactionSearchFilters = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    try {
      const result = await this.transactionService.searchTransactions(userId, filters, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get transaction statistics/summary
  getTransactionStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;

    try {
      const stats = await this.transactionService.getDashboardSummary(userId);
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
} 