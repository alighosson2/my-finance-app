import { Request, Response } from 'express';
import { FinancialAccountService } from '../services/FinancialAccountService';
import { CreateFinancialAccountDTO, UpdateFinancialAccountDTO } from '../model/FinancialAccountModel';
import { AuthRequest } from '../config/types';

export class FinancialAccountController {
  constructor(private financialAccountService: FinancialAccountService) {}

  // Helper method to detect if request is from web form vs API
  private isWebRequest(req: AuthRequest): boolean {
    const acceptHeader = req.get('Accept') || '';
    const contentType = req.get('Content-Type') || '';

    // If the request accepts HTML or is a form submission, treat as web request
    return acceptHeader.includes('text/html') ||
           contentType.includes('application/x-www-form-urlencoded') ||
           contentType.includes('multipart/form-data');
  }

    getAllAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.financialAccountService.getAllAccounts(userId, page, limit);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to accounts page (the page should load its own data)
        res.redirect('/accounts.html?action=refreshed');
        return;
      } else {
        // For API requests, return JSON
        res.status(200).json(result);
        return;
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_load_accounts');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };

    getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user_id;

      if (isNaN(accountId)) {
        if (this.isWebRequest(req)) {
          res.redirect('/accounts.html?error=invalid_account_id');
          return;
        } else {
          res.status(400).json({ error: 'Invalid account ID' });
          return;
        }
      }

      const account = await this.financialAccountService.getAccountById(accountId, userId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to accounts page (could include account ID in query)
        res.redirect(`/accounts.html?account=${accountId}`);
        return;
      } else {
        // For API requests, return JSON
        res.status(200).json(account);
        return;
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_load_account');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };

    createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id;

      const accountData: CreateFinancialAccountDTO = {
        ...req.body,
        user_id: userId,
      };

      const newAccount = await this.financialAccountService.createAccount(accountData);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to accounts page with success message
        res.redirect('/accounts.html?success=account_created');
        return;
      } else {
        // For API requests, return JSON
        res.status(201).json({
          message: 'Account created successfully',
          account: newAccount,
        });
        return;
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_create_account');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };

    updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user_id;

      if (isNaN(accountId)) {
        if (this.isWebRequest(req)) {
          res.redirect('/accounts.html?error=invalid_account_id');
          return;
        } else {
          res.status(400).json({ error: 'Invalid account ID' });
          return;
        }
      }

      const updateData: UpdateFinancialAccountDTO = req.body;
      const updatedAccount = await this.financialAccountService.updateAccount(accountId, updateData, userId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to accounts page with success message
        res.redirect('/accounts.html?success=account_updated');
        return;
      } else {
        // For API requests, return JSON
        res.status(200).json({
          message: 'Account updated successfully',
          account: updatedAccount,
        });
        return;
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_update_account');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };

    deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user_id;

      if (isNaN(accountId)) {
        if (this.isWebRequest(req)) {
          res.redirect('/accounts.html?error=invalid_account_id');
          return;
        } else {
          res.status(400).json({ error: 'Invalid account ID' });
          return;
        }
      }

      const success = await this.financialAccountService.deleteAccount(accountId, userId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        if (success) {
          res.redirect('/accounts.html?success=account_deleted');
          return;
        } else {
          res.redirect('/accounts.html?error=failed_to_delete_account');
          return;
        }
      } else {
        if (success) {
          res.status(200).json({ message: 'Account deleted successfully' });
          return;
        } else {
          res.status(500).json({ error: 'Failed to delete account' });
          return;
        }
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_delete_account');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };

    getAccountSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user_id;

      const summary = await this.financialAccountService.getAccountSummary(userId);

      // Check if this is a web form submission or API request
      if (this.isWebRequest(req)) {
        // For web forms, redirect to accounts page
        res.redirect('/accounts.html?action=summary_refreshed');
        return;
      } else {
        // For API requests, return JSON
        res.status(200).json(summary);
        return;
      }
    } catch (error: any) {
      if (this.isWebRequest(req)) {
        res.redirect('/accounts.html?error=failed_to_load_summary');
        return;
      } else {
        res.status(500).json({ error: error.message });
        return;
      }
    }
  };
}
