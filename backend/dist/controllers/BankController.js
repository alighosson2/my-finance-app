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
    }
}
exports.BankController = BankController;
//# sourceMappingURL=BankController.js.map