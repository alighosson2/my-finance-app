import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../services/TransactionService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Create service and controller instances
const transactionService = new TransactionService();
const transactionController = new TransactionController(transactionService);

// All routes require authentication
router.use(authenticate);

// Transaction CRUD routes
router.get('/', asyncHandler(transactionController.getAllTransactions));
router.get('/search', asyncHandler(transactionController.searchTransactions));
router.get('/stats', asyncHandler(transactionController.getTransactionStats));
router.get('/:id', asyncHandler(transactionController.getTransactionById));
router.post('/', asyncHandler(transactionController.createTransaction));
router.put('/:id', asyncHandler(transactionController.updateTransaction));
router.delete('/:id', asyncHandler(transactionController.deleteTransaction));

// Account-specific transaction routes
router.get('/account/:accountId', asyncHandler(transactionController.getTransactionsByAccount));

export default router; 