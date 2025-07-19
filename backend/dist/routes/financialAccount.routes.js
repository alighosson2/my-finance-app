"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FinancialAccountController_1 = require("../controllers/FinancialAccountController");
const FinancialAccountService_1 = require("../services/FinancialAccountService");
const auth_1 = require("../middleware/auth");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
// Create service and controller instances
const accountService = new FinancialAccountService_1.FinancialAccountService();
const accountController = new FinancialAccountController_1.FinancialAccountController(accountService);
// Account routes (all require authentication)
router.post('/', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.createAccount));
router.get('/', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getUserAccounts));
router.get('/active', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getActiveAccounts));
router.get('/manual', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getManualAccounts));
router.get('/summary', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getAccountSummary));
router.get('/:accountId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getAccountById));
router.put('/:accountId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.updateAccount));
router.patch('/:accountId/balance', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.updateBalance));
router.delete('/:accountId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.deleteAccount));
// Bank-specific routes (all require authentication)
router.post('/bank/:bankTokenId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.createBankLinkedAccount));
router.get('/bank/:bankTokenId', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.getAccountsByBank));
router.patch('/:accountId/link-bank', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.linkAccountToBank));
router.patch('/:accountId/unlink-bank', auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(accountController.unlinkAccountFromBank));
exports.default = router;
//# sourceMappingURL=financialAccount.routes.js.map