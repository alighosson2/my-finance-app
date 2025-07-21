"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/index.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const user_routes_1 = __importDefault(require("../routes/user.routes"));
const bank_routes_1 = __importDefault(require("./bank.routes"));
const bankOAuth_routes_1 = __importDefault(require("./bankOAuth.routes"));
const financialAccount_routes_1 = __importDefault(require("./financialAccount.routes"));
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const tax_routes_1 = __importDefault(require("./tax.routes"));
const routes = (0, express_1.Router)();
routes.use('/user', user_routes_1.default);
routes.use('/auth', auth_routes_1.default);
routes.use('/bank', bankOAuth_routes_1.default); // OAuth routes: /test, /start, /callback 
routes.use('/bank/api', bank_routes_1.default); // Bank API routes under /bank/api to avoid conflicts
routes.use('/accounts', financialAccount_routes_1.default);
routes.use('/transactions', transaction_routes_1.default);
routes.use('/tax', tax_routes_1.default);
exports.default = routes;
/*import { Router } from "express";
const routes = Router();

routes.use('/user', require('./user.routes'));
export default routes;*/
//# sourceMappingURL=index.js.map