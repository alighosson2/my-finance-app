"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/bank.routes.ts
const express_1 = require("express");
const BankOAuthController_1 = require("../controllers/BankOAuthController");
const validateOAuthConfig_1 = require("../middleware/validateOAuthConfig");
const router = (0, express_1.Router)();
router.use(validateOAuthConfig_1.validateOAuthConfig);
router.get('/test-oauth', BankOAuthController_1.testOAuthSignature);
router.get('/connect', BankOAuthController_1.startAuth);
router.get('/callback', BankOAuthController_1.authCallback); // This route now matches the OBP configuration
exports.default = router;
//# sourceMappingURL=bankOAuth.routes.js.map