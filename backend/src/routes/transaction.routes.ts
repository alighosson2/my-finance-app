// src/routes/transaction.routes.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../services/TransactionService';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticate } from '../middleware/auth';

const router = Router();
const transactionService = new TransactionService();
const transactionController = new TransactionController(transactionService);
 
// All transaction routes require authentication
router.use(authenticate);

// Main transaction CRUD routes
router.route('/')
  .get(asyncHandler(transactionController.getAllTransactions.bind(transactionController))) // GET /transactions - get all transactions (admin only)
  .post(asyncHandler(transactionController.createTransaction.bind(transactionController))); // POST /transactions - create transaction

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Dashboard route (BEFORE /:id)
router.route('/dashboard')
  .get(asyncHandler(transactionController.getDashboardSummary.bind(transactionController))); // GET /transactions/dashboard - get dashboard summary

// Search and filter routes (BEFORE /:id)
router.route('/search')
  .get(asyncHandler(transactionController.searchTransactions.bind(transactionController))); // GET /transactions/search - search transactions with filters

// User-specific transaction routes (BEFORE /:id)
router.route('/user/:userId')
  .get(asyncHandler(transactionController.getTransactionsByUser.bind(transactionController))); // GET /transactions/user/:userId - get user's transactions

// Parameterized routes MUST come LAST (after all specific routes)
router.route('/:id')
  .get(asyncHandler(transactionController.getTransactionById.bind(transactionController))) // GET /transactions/:id - get specific transaction
  .put(asyncHandler(transactionController.updateTransaction.bind(transactionController))) // PUT /transactions/:id - update transaction
  .delete(asyncHandler(transactionController.deleteTransaction.bind(transactionController))); // DELETE /transactions/:id - delete transaction

export default router; 