"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionController_1 = require("../controllers/TransactionController");
const TransactionService_1 = require("../services/TransactionService");
const auth_1 = require("../middleware/auth");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
// Create service and controller instances
const transactionService = new TransactionService_1.TransactionService();
const transactionController = new TransactionController_1.TransactionController(transactionService);
// All routes require authentication
router.use(auth_1.authenticate);
// Transaction CRUD routes
router.get('/', (0, errorMiddleware_1.asyncHandler)(transactionController.getAllTransactions));
router.get('/search', (0, errorMiddleware_1.asyncHandler)(transactionController.searchTransactions));
router.get('/stats', (0, errorMiddleware_1.asyncHandler)(transactionController.getTransactionStats));
router.get('/:id', (0, errorMiddleware_1.asyncHandler)(transactionController.getTransactionById));
router.post('/', (0, errorMiddleware_1.asyncHandler)(transactionController.createTransaction));
router.put('/:id', (0, errorMiddleware_1.asyncHandler)(transactionController.updateTransaction));
router.delete('/:id', (0, errorMiddleware_1.asyncHandler)(transactionController.deleteTransaction));
// Account-specific transaction routes
router.get('/account/:accountId', (0, errorMiddleware_1.asyncHandler)(transactionController.getTransactionsByAccount));
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map