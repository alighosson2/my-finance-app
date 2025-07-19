"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankController = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
class BankController {
    constructor(bankService) {
        this.bankService = bankService;
        this.connectBankAccount = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const dto = req.body;
            const token = await this.bankService.connectBankAccount(userId, dto);
            res.status(201).json(token.toJSON());
        });
        this.getBankConnections = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const tokens = await this.bankService.getUserBankTokens(userId);
            res.json(tokens.map(t => t.toJSON()));
        });
        this.revokeBankConnection = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const tokenId = parseInt(req.params.tokenId);
            if (isNaN(tokenId)) {
                return res.status(400).json({ error: 'Invalid token ID' });
            }
            await this.bankService.revokeBankToken(userId, tokenId);
            res.status(204).send();
        });
        this.getBankToken = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const tokenId = parseInt(req.params.tokenId);
            if (isNaN(tokenId)) {
                return res.status(400).json({ error: 'Invalid token ID' });
            }
            const token = await this.bankService.getTokenById(tokenId);
            if (token.user_id !== userId) {
                return res.status(404).json({ error: 'Token not found' });
            }
            res.json(token.toJSON());
        });
        this.updateBankToken = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const tokenId = parseInt(req.params.tokenId);
            if (isNaN(tokenId)) {
                return res.status(400).json({ error: 'Invalid token ID' });
            }
            // Verify token belongs to user
            const existingToken = await this.bankService.getTokenById(tokenId);
            if (existingToken.user_id !== userId) {
                return res.status(404).json({ error: 'Token not found' });
            }
            const token = await this.bankService.updateToken(tokenId, req.body);
            res.json(token.toJSON());
        });
        // ===== OBP DATA SYNC ENDPOINTS =====
        this.testOBPConnection = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const { tokenId } = req.body;
            const isConnected = await this.bankService.testOBPConnection(userId, tokenId);
            res.json({
                connected: isConnected,
                message: isConnected ? 'OBP connection successful' : 'OBP connection failed',
                timestamp: new Date().toISOString()
            });
        });
        this.syncAccountsFromOBP = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const { tokenId } = req.body;
            const result = await this.bankService.syncAccountsFromOBP(userId, tokenId);
            res.json({
                success: result.errors.length === 0,
                synced: result.synced,
                errors: result.errors,
                accounts: result.accounts,
                message: `Successfully synced ${result.synced} accounts from OBP`,
                timestamp: new Date().toISOString()
            });
        });
        this.syncTransactionsFromOBP = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const accountId = parseInt(req.params.accountId);
            const { limit = 50 } = req.body;
            if (isNaN(accountId)) {
                return res.status(400).json({ error: 'Invalid account ID' });
            }
            const result = await this.bankService.syncTransactionsFromOBP(userId, accountId, limit);
            res.json({
                success: result.errors.length === 0,
                synced: result.synced,
                errors: result.errors,
                transactions: result.transactions,
                message: `Successfully synced ${result.synced} transactions from OBP`,
                timestamp: new Date().toISOString()
            });
        });
        this.syncAllDataFromOBP = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user_id;
            const { transactionLimit = 50 } = req.body;
            const result = await this.bankService.syncAllDataFromOBP(userId, transactionLimit);
            res.json({
                success: result.accounts.errors.length === 0 && result.transactions.errors.length === 0,
                accounts: {
                    synced: result.accounts.synced,
                    errors: result.accounts.errors
                },
                transactions: {
                    synced: result.transactions.synced,
                    errors: result.transactions.errors
                },
                message: `Successfully synced ${result.accounts.synced} accounts and ${result.transactions.synced} transactions from OBP`,
                timestamp: new Date().toISOString()
            });
        });
    }
}
exports.BankController = BankController;
//# sourceMappingURL=BankController.js.map