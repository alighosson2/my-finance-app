import { Router } from 'express';
import { BankController } from '../controllers/BankController'; // Named import
import { BankService } from '../services/BankService'; // Service import
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Create service and controller instances
const bankService = new BankService();
const bankController = new BankController(bankService);

// Token management routes (all require authentication)
router.post('/tokens', authenticate, asyncHandler(bankController.connectBankAccount));
router.get('/tokens', authenticate, asyncHandler(bankController.getBankConnections));
router.delete('/tokens/:tokenId', authenticate, asyncHandler(bankController.revokeBankConnection));

export default router;