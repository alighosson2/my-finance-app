// src/routes/bank.routes.ts
import { Router } from 'express';
import { startAuth, authCallback, testOAuthSignature } from '../controllers/BankOAuthController';
import { validateOAuthConfig } from '../middleware/validateOAuthConfig';

const router = Router();

router.use(validateOAuthConfig);

router.get('/test', testOAuthSignature);
router.get('/start', startAuth);  // Changed from /connect to /start for clarity
router.get('/callback', authCallback);

export default router;