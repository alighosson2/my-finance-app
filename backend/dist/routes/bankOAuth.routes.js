"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/bank.routes.ts
const express_1 = require("express");
const BankOAuthController_1 = require("../controllers/BankOAuthController");
const validateOAuthConfig_1 = require("../middleware/validateOAuthConfig");
const router = (0, express_1.Router)();
router.use(validateOAuthConfig_1.validateOAuthConfig);
router.get('/test', BankOAuthController_1.testOAuthSignature);
router.get('/start', BankOAuthController_1.startAuth); // Changed from /connect to /start for clarity
router.get('/callback', BankOAuthController_1.authCallback);
exports.default = router;
//# sourceMappingURL=bankOAuth.routes.js.map