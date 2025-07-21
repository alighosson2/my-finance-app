import { Request, Response } from 'express';
import { FinancialAccountService } from '../services/FinancialAccountService';
import { CreateFinancialAccountDTO, UpdateFinancialAccountDTO } from '../model/FinancialAccountModel';
import { AuthRequest } from '../config/types';

export class FinancialAccountController {
  constructor(private financialAccountService: FinancialAccountService) {}

  getAllAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.financialAccountService.getAllAccounts(userId, page, limit);
    
    res.status(200).json(result);
  };

  getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
    const accountId = parseInt(req.params.id);
    const userId = req.user_id;

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const account = await this.financialAccountService.getAccountById(accountId, userId);
    
    res.status(200).json(account);
  };

  createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;
    
    const accountData: CreateFinancialAccountDTO = {
      ...req.body,
      user_id: userId,
    };

    const newAccount = await this.financialAccountService.createAccount(accountData);
    
    res.status(201).json({
      message: 'Account created successfully',
      account: newAccount,
    });
  };

  updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    const accountId = parseInt(req.params.id);
    const userId = req.user_id;

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const updateData: UpdateFinancialAccountDTO = req.body;
    const updatedAccount = await this.financialAccountService.updateAccount(accountId, updateData, userId);
    
    res.status(200).json({
      message: 'Account updated successfully',
      account: updatedAccount,
    });
  };

  deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    const accountId = parseInt(req.params.id);
    const userId = req.user_id;

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const success = await this.financialAccountService.deleteAccount(accountId, userId);
    
    if (success) {
      res.status(200).json({ message: 'Account deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  };

  getAccountSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user_id;

    const summary = await this.financialAccountService.getAccountSummary(userId);
    
    res.status(200).json(summary);
  };
} 