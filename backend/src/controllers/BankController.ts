import { Response } from 'express';
import { BankService } from '../services/BankService';
import { CreateBankTokenDto } from '../model/Bankmodel';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';
import { AuthRequest } from '../config/types';

export class BankController {
  constructor(private bankService: BankService) {}

  // Helper method to detect if request is from web form vs API
  private isWebRequest(req: AuthRequest): boolean {
    const acceptHeader = req.get('Accept') || '';
    const contentType = req.get('Content-Type') || '';

    // If the request accepts HTML or is a form submission, treat as web request
    return acceptHeader.includes('text/html') ||
           contentType.includes('application/x-www-form-urlencoded') ||
           contentType.includes('multipart/form-data');
  }

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

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to dashboard with success message
        return res.redirect('/dashboard.html?success=bank_connected');
      } else {
        // For API requests, return JSON
        return res.status(201).json(token.toJSON());
      }
    } catch (error: any) {
      console.error('❌ ConnectBankAccount Error Details:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      console.error('- Error details:', error);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect with error message
        return res.redirect('/dashboard.html?error=bank_connection_failed');
      } else {
        // For API requests, return JSON error
        return res.status(500).json({
          message: 'Bank connection failed',
          error: error.message,
          details: error.stack
        });
      }
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

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to dashboard with bank info (could display in URL params or session)
        return res.redirect('/dashboard.html?action=banks_refreshed');
      } else {
        // For API requests, return JSON
        return res.json(tokensJson);
      }
    } catch (error: any) {
      console.error('❌ Get bank connections error:', error);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect with error
        return res.redirect('/dashboard.html?error=failed_to_load_banks');
      } else {
        // For API requests, return JSON error
        return res.status(500).json({ error: error.message });
      }
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

    try {
      const isConnected = await this.bankService.testOBPConnection(userId, tokenId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        if (isConnected) {
          return res.redirect('/dashboard.html?success=connection_test_passed');
        } else {
          return res.redirect('/dashboard.html?error=connection_test_failed');
        }
      } else {
        return res.json({
          connected: isConnected,
          message: isConnected ? 'OBP connection successful' : 'OBP connection failed',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        return res.redirect('/dashboard.html?error=connection_test_error');
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  });

  syncAccountsFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const { tokenId } = req.body || {}; // Make tokenId optional

    try {
      const result = await this.bankService.syncAccountsFromOBP(userId, tokenId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        if (result.errors.length === 0) {
          return res.redirect(`/accounts.html?success=synced_${result.synced}_accounts`);
        } else {
          return res.redirect('/dashboard.html?error=sync_accounts_failed');
        }
      } else {
        return res.json({
          success: result.errors.length === 0,
          synced: result.synced,
          errors: result.errors,
          accounts: result.accounts,
          message: `Successfully synced ${result.synced} accounts from OBP`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        return res.redirect('/dashboard.html?error=sync_accounts_error');
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  });

  syncTransactionsFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const accountId = parseInt(req.params.accountId);
    const { limit = 50 } = req.body;

    if (isNaN(accountId)) {
      if (this.isWebRequest(req)) {
        return res.redirect('/accounts.html?error=invalid_account_id');
      } else {
        return res.status(400).json({ error: 'Invalid account ID' });
      }
    }

    try {
      const result = await this.bankService.syncTransactionsFromOBP(userId, accountId, limit);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        if (result.errors.length === 0) {
          return res.redirect(`/transactions.html?success=synced_${result.synced}_transactions`);
        } else {
          return res.redirect('/accounts.html?error=sync_transactions_failed');
        }
      } else {
        return res.json({
          success: result.errors.length === 0,
          synced: result.synced,
          errors: result.errors,
          transactions: result.transactions,
          message: `Successfully synced ${result.synced} transactions from OBP`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        return res.redirect('/accounts.html?error=sync_transactions_error');
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  });

  syncAllDataFromOBP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user_id;
    const { transactionLimit = 50 } = req.body;

    try {
      const result = await this.bankService.syncAllDataFromOBP(userId, transactionLimit);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        const success = result.accounts.errors.length === 0 && result.transactions.errors.length === 0;
        if (success) {
          return res.redirect(`/dashboard.html?success=synced_${result.accounts.synced}_accounts_${result.transactions.synced}_transactions`);
        } else {
          return res.redirect('/dashboard.html?error=sync_all_failed');
        }
      } else {
        return res.json({
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
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        return res.redirect('/dashboard.html?error=sync_all_error');
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  });
}



