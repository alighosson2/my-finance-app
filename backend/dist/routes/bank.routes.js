"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BankController_1 = require("../controllers/BankController"); // Named import
const BankService_1 = require("../services/BankService"); // Service import
const auth_1 = require("../middleware/auth");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
// Create service and controller instances
const bankService = new BankService_1.BankService();
const bankController = new BankController_1.BankController(bankService);
// Token management routes (all require authentication)
router.post('/tokens', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.connectBankAccount));
router.get('/tokens', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.getBankConnections));
router.delete('/tokens/:tokenId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.revokeBankConnection));
// OBP Data Sync routes (all require authentication)
router.post('/sync/test', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.testOBPConnection));
router.post('/sync/accounts', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.syncAccountsFromOBP));
router.post('/sync/transactions/:accountId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.syncTransactionsFromOBP));
router.post('/sync/all', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(bankController.syncAllDataFromOBP));
exports.default = router;
//# sourceMappingURL=bank.routes.js.map