import { Router } from 'express';
import { FinancialAccountController } from '../controllers/FinancialAccountController';
import { FinancialAccountService } from '../services/FinancialAccountService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Create service and controller instances
const financialAccountService = new FinancialAccountService();
const financialAccountController = new FinancialAccountController(financialAccountService);

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', asyncHandler(financialAccountController.getAllAccounts));
router.get('/:id', asyncHandler(financialAccountController.getAccountById));
router.post('/', asyncHandler(financialAccountController.createAccount));
router.put('/:id', asyncHandler(financialAccountController.updateAccount));
router.delete('/:id', asyncHandler(financialAccountController.deleteAccount));

// Account statistics
router.get('/stats/summary', asyncHandler(financialAccountController.getAccountSummary));

export default router; 