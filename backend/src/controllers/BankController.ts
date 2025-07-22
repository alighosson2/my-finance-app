import { Response } from 'express';
import { BankService } from '../services/BankService';
import { CreateBankTokenDto } from '../model/Bankmodel';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';
import { AuthRequest } from '../config/types';

export class BankController {
  constructor(private bankService: BankService) {}

  connectBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 ConnectBankAccount Debug:');
      console.log('- User ID:', req.user_id);
      console.log('- Request body:', JSON.stringify(req.body, null, 2));
      
    const userId = req.user_id;
      let dto: Omit<CreateBankTokenDto, 'user_id'> = req.body;
      
      // Fix expires_at format if needed (fallback for browser cache issues)
      if (dto.expires_at && typeof dto.expires_at === 'string') {
        const expiresAtStr = dto.expires_at as string;
        
        // If it's in format "2025-07-22T23:29" (missing seconds), fix it
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(expiresAtStr)) {
          const fixedDate = new Date(expiresAtStr + ':00').toISOString();
          console.log('🔧 Backend date fix:', {
            original: expiresAtStr,
            fixed: fixedDate
          });
          dto = { ...dto, expires_at: fixedDate as any };
        }
      }
      
      console.log('- DTO after processing:', JSON.stringify(dto, null, 2));
    
    const token = await this.bankService.connectBankAccount(userId, dto);
      console.log('✅ Bank token created successfully:', token.id);
      
    res.status(201).json(token.toJSON());
    } catch (error: any) {
      console.error('❌ ConnectBankAccount Error Details:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      console.error('- Error details:', error);
      
      // Return detailed error for debugging
      res.status(500).json({
        message: 'Bank connection failed',
        error: error.message,
        details: error.stack
      });
    }
  });

  getBankConnections = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
    const userId = req.user_id;
      console.log('🔍 Getting bank connections for user:', userId);
      
    const tokens = await this.bankService.getUserBankTokens(userId);
      console.log('✅ Found', tokens.length, 'bank tokens');
      
      const tokensJson = tokens.map(t => {
        const tokenJson = t.toJSON();
        // Add helpful info for frontend
        return {
          ...tokenJson,
          isExpired: new Date() > new Date(tokenJson.expires_at),
          expiresIn: Math.ceil((new Date(tokenJson.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) // days
        };
      });
      
      res.json(tokensJson);
    } catch (error: any) {
      console.error('❌ Get bank connections error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  revokeBankConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    await this.bankService.revokeBankToken(userId, tokenId);
    res.status(204).send();
  });

  getBankToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    const token = await this.bankService.getTokenById(tokenId);
    if (token.user_id !== userId) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token.toJSON());
  });

  updateBankToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }
    
    // Verify token belongs to user
    const existingToken = await this.bankService.getTokenById(tokenId);
    if (existingToken.user_id !== userId) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = await this.bankService.updateToken(tokenId, req.body);
    res.json(token.toJSON());
  });

  // ===== OBP DATA SYNC ENDPOINTS =====

  testOBPConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const { tokenId } = req.body;
    
    const isConnected = await this.bankService.testOBPConnection(userId, tokenId);
    
    res.json({
      connected: isConnected,
      message: isConnected ? 'OBP connection successful' : 'OBP connection failed',
      timestamp: new Date().toISOString()
    });
  });

  syncAccountsFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const { tokenId } = req.body || {}; // Make tokenId optional
    
    const result = await this.bankService.syncAccountsFromOBP(userId, tokenId);
    
    res.json({
      success: result.errors.length === 0,
      synced: result.synced,
      errors: result.errors,
      accounts: result.accounts,
      message: `Successfully synced ${result.synced} accounts from OBP`,
      timestamp: new Date().toISOString()
    });
  });

  syncTransactionsFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    const { limit = 50 } = req.body;
    
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const result = await this.bankService.syncTransactionsFromOBP(userId, accountId, limit);
    
    res.json({
      success: result.errors.length === 0,
      synced: result.synced,
      errors: result.errors,
      transactions: result.transactions,
      message: `Successfully synced ${result.synced} transactions from OBP`,
      timestamp: new Date().toISOString()
    });
  });

  syncAllDataFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const { transactionLimit = 50 } = req.body;
    
    const result = await this.bankService.syncAllDataFromOBP(userId, transactionLimit);
    
    res.json({
      success: result.accounts.errors.length === 0 && result.transactions.errors.length === 0,
      accounts: {
        synced: result.accounts.synced,
        errors: result.accounts.errors
      },
      transactions: {
        synced: result.transactions.synced,
        errors: result.transactions.errors
      },
      message: `Successfully synced ${result.accounts.synced} accounts and ${result.transactions.synced} transactions from OBP`,
      timestamp: new Date().toISOString()
    });
  });
}



