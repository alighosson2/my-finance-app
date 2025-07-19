"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountController = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
class FinancialAccountController {
    constructor(accountService) {
        this.accountService = accountService;
        // Create a new financial account
        this.createAccount = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const dto = req.body;
            const account = await this.accountService.createAccount({
                ...dto,
                user_id: userId
            });
            res.status(201).json(account.toJSON());
        });
        // Get all accounts for the authenticated user
        this.getUserAccounts = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accounts = await this.accountService.getAccountsByUser(userId);
            res.json(accounts.map(a => a.toJSON()));
        });
        // Get only active accounts for the authenticated user
        this.getActiveAccounts = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accounts = await this.accountService.getActiveAccountsByUser(userId);
            res.json(accounts.map(a => a.toJSON()));
        });
        // Get a specific account by ID
        this.getAccountById = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            const account = await this.accountService.verifyAccountOwnership(accountId, userId);
            res.json(account.toJSON());
        });
        // Update an account
        this.updateAccount = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            // Verify ownership first
            await this.accountService.verifyAccountOwnership(accountId, userId);
            const dto = req.body;
            const account = await this.accountService.updateAccount(accountId, dto);
            res.json(account.toJSON());
        });
        // Update account balance
        this.updateBalance = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            // Verify ownership first
            await this.accountService.verifyAccountOwnership(accountId, userId);
            const dto = req.body;
            const account = await this.accountService.updateBalance(accountId, dto);
            res.json(account.toJSON());
        });
        // Delete an account
        this.deleteAccount = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            // Verify ownership first
            await this.accountService.verifyAccountOwnership(accountId, userId);
            await this.accountService.deleteAccount(accountId);
            res.status(204).send();
        });
        // Get account summary for the user
        this.getAccountSummary = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const summary = await this.accountService.getAccountSummary(userId);
            res.json(summary);
        });
        // NEW: Create account linked to a specific bank
        this.createBankLinkedAccount = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const bankTokenId = parseInt(req.params.bankTokenId);
            if (isNaN(bankTokenId)) {
                return res.status(400).json({ error: 'Invalid bank token ID' });
            }
            const dto = req.body;
            const account = await this.accountService.createBankLinkedAccount(userId, bankTokenId, dto);
            res.status(201).json(account.toJSON());
        });
        // NEW: Get accounts for a specific bank
        this.getAccountsByBank = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const bankTokenId = parseInt(req.params.bankTokenId);
            if (isNaN(bankTokenId)) {
                return res.status(400).json({ error: 'Invalid bank token ID' });
            }
            const accounts = await this.accountService.getAccountsByBank(userId, bankTokenId);
            res.json(accounts.map(a => a.toJSON()));
        });
        // NEW: Get manual (non-bank) accounts
        this.getManualAccounts = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accounts = await this.accountService.getManualAccounts(userId);
            res.json(accounts.map(a => a.toJSON()));
        });
        // NEW: Link existing account to a bank
        this.linkAccountToBank = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            const { bankTokenId } = req.body;
            if (isNaN(accountId) || !bankTokenId) {
                return res.status(400).json({ error: 'Invalid account ID or bank token ID' });
            }
            const account = await this.accountService.linkAccountToBank(userId, accountId, bankTokenId);
            res.json(account.toJSON());
        });
        // NEW: Unlink account from bank
        this.unlinkAccountFromBank = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            const account = await this.accountService.unlinkAccountFromBank(userId, accountId);
            res.json(account.toJSON());
        });
    }
}
exports.FinancialAccountController = FinancialAccountController;
//# sourceMappingURL=FinancialAccountController.js.map