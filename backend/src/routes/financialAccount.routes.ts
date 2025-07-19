import { Router } from 'express';
import { FinancialAccountController } from '../controllers/FinancialAccountController';
import { FinancialAccountService } from '../services/FinancialAccountService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Create service and controller instances
const accountService = new FinancialAccountService();
const accountController = new FinancialAccountController(accountService);

// Account routes (all require authentication)
router.post('/', authenticate, asyncHandler(accountController.createAccount));
router.get('/', authenticate, asyncHandler(accountController.getUserAccounts));
router.get('/active', authenticate, asyncHandler(accountController.getActiveAccounts));
router.get('/manual', authenticate, asyncHandler(accountController.getManualAccounts));
router.get('/summary', authenticate, asyncHandler(accountController.getAccountSummary));
router.get('/:accountId', authenticate, asyncHandler(accountController.getAccountById));
router.put('/:accountId', authenticate, asyncHandler(accountController.updateAccount));
router.patch('/:accountId/balance', authenticate, asyncHandler(accountController.updateBalance));
router.delete('/:accountId', authenticate, asyncHandler(accountController.deleteAccount));

// Bank-specific routes (all require authentication)
router.post('/bank/:bankTokenId', authenticate, asyncHandler(accountController.createBankLinkedAccount));
router.get('/bank/:bankTokenId', authenticate, asyncHandler(accountController.getAccountsByBank));
router.patch('/:accountId/link-bank', authenticate, asyncHandler(accountController.linkAccountToBank));
router.patch('/:accountId/unlink-bank', authenticate, asyncHandler(accountController.unlinkAccountFromBank));

export default router; 