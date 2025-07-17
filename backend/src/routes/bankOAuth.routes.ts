// src/routes/bank.routes.ts
import { Router } from 'express';
import { startAuth, authCallback, testOAuthSignature } from '../controllers/BankOAuthController';
import { validateOAuthConfig } from '../middleware/validateOAuthConfig';

const router = Router();

router.use(validateOAuthConfig);

router.get('/test-oauth', testOAuthSignature);
router.get('/connect', startAuth);
router.get('/callback', authCallback); // This route now matches the OBP configuration

export default router;