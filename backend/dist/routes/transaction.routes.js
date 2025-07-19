"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/transaction.routes.ts
const express_1 = require("express");
const TransactionController_1 = require("../controllers/TransactionController");
const TransactionService_1 = require("../services/TransactionService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const transactionService = new TransactionService_1.TransactionService();
const transactionController = new TransactionController_1.TransactionController(transactionService);
// All transaction routes require authentication
router.use(auth_1.authenticate);
// Main transaction CRUD routes
router.route('/')
    .get((0, errorMiddleware_1.asyncHandler)(transactionController.getAllTransactions.bind(transactionController))) // GET /transactions - get all transactions (admin only)
    .post((0, errorMiddleware_1.asyncHandler)(transactionController.createTransaction.bind(transactionController))); // POST /transactions - create transaction
// IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Dashboard route (BEFORE /:id)
router.route('/dashboard')
    .get((0, errorMiddleware_1.asyncHandler)(transactionController.getDashboardSummary.bind(transactionController))); // GET /transactions/dashboard - get dashboard summary
// Search and filter routes (BEFORE /:id)
router.route('/search')
    .get((0, errorMiddleware_1.asyncHandler)(transactionController.searchTransactions.bind(transactionController))); // GET /transactions/search - search transactions with filters
// User-specific transaction routes (BEFORE /:id)
router.route('/user/:userId')
    .get((0, errorMiddleware_1.asyncHandler)(transactionController.getTransactionsByUser.bind(transactionController))); // GET /transactions/user/:userId - get user's transactions
// Parameterized routes MUST come LAST (after all specific routes)
router.route('/:id')
    .get((0, errorMiddleware_1.asyncHandler)(transactionController.getTransactionById.bind(transactionController))) // GET /transactions/:id - get specific transaction
    .put((0, errorMiddleware_1.asyncHandler)(transactionController.updateTransaction.bind(transactionController))) // PUT /transactions/:id - update transaction
    .delete((0, errorMiddleware_1.asyncHandler)(transactionController.deleteTransaction.bind(transactionController))); // DELETE /transactions/:id - delete transaction
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map