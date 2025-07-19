import { Response } from 'express';
import { FinancialAccountService } from '../services/FinancialAccountService';
import { CreateFinancialAccountDto, UpdateFinancialAccountDto, AccountBalanceUpdateDto } from '../model/FinancialAccountModel';
import { asyncHandler } from '../middleware/errorMiddleware';
import { AuthRequest } from '../config/types';

export class FinancialAccountController {
  constructor(private accountService: FinancialAccountService) {}

  // Create a new financial account
  createAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const dto: Omit<CreateFinancialAccountDto, 'user_id'> = req.body;
    
    const account = await this.accountService.createAccount({
      ...dto,
      user_id: userId
    });
    
    res.status(201).json(account.toJSON());
  });

  // Get all accounts for the authenticated user
  getUserAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accounts = await this.accountService.getAccountsByUser(userId);
    res.json(accounts.map(a => a.toJSON()));
  });

  // Get only active accounts for the authenticated user
  getActiveAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accounts = await this.accountService.getActiveAccountsByUser(userId);
    res.json(accounts.map(a => a.toJSON()));
  });

  // Get a specific account by ID
  getAccountById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const account = await this.accountService.verifyAccountOwnership(accountId, userId);
    res.json(account.toJSON());
  });

  // Update an account
  updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    // Verify ownership first
    await this.accountService.verifyAccountOwnership(accountId, userId);
    
    const dto: UpdateFinancialAccountDto = req.body;
    const account = await this.accountService.updateAccount(accountId, dto);
    res.json(account.toJSON());
  });

  // Update account balance
  updateBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    // Verify ownership first
    await this.accountService.verifyAccountOwnership(accountId, userId);
    
    const dto: AccountBalanceUpdateDto = req.body;
    const account = await this.accountService.updateBalance(accountId, dto);
    res.json(account.toJSON());
  });

  // Delete an account
  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    // Verify ownership first
    await this.accountService.verifyAccountOwnership(accountId, userId);
    
    await this.accountService.deleteAccount(accountId);
    res.status(204).send();
  });

  // Get account summary for the user
  getAccountSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const summary = await this.accountService.getAccountSummary(userId);
    res.json(summary);
  });

  // NEW: Create account linked to a specific bank
  createBankLinkedAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const bankTokenId = parseInt(req.params.bankTokenId);
    
    if (isNaN(bankTokenId)) {
      return res.status(400).json({ error: 'Invalid bank token ID' });
    }
    
    const dto = req.body;
    const account = await this.accountService.createBankLinkedAccount(userId, bankTokenId, dto);
    res.status(201).json(account.toJSON());
  });

  // NEW: Get accounts for a specific bank
  getAccountsByBank = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const bankTokenId = parseInt(req.params.bankTokenId);
    
    if (isNaN(bankTokenId)) {
      return res.status(400).json({ error: 'Invalid bank token ID' });
    }
    
    const accounts = await this.accountService.getAccountsByBank(userId, bankTokenId);
    res.json(accounts.map(a => a.toJSON()));
  });

  // NEW: Get manual (non-bank) accounts
  getManualAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accounts = await this.accountService.getManualAccounts(userId);
    res.json(accounts.map(a => a.toJSON()));
  });

  // NEW: Link existing account to a bank
  linkAccountToBank = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    const { bankTokenId } = req.body;
    
    if (isNaN(accountId) || !bankTokenId) {
      return res.status(400).json({ error: 'Invalid account ID or bank token ID' });
    }
    
    const account = await this.accountService.linkAccountToBank(userId, accountId, bankTokenId);
    res.json(account.toJSON());
  });

  // NEW: Unlink account from bank
  unlinkAccountFromBank = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const account = await this.accountService.unlinkAccountFromBank(userId, accountId);
    res.json(account.toJSON());
  });
} 