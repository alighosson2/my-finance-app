//src/routes/index.ts
import { Router } from "express";
import  AuthRoutes from "../routes/auth.routes"
import  UserRoutes from "../routes/user.routes"
import { authenticate } from "../middleware/auth";
import BankRoutes from "./bank.routes";
import OAuthBankRoutes from "./bankOAuth.routes";
import FinancialAccountRoutes from "./financialAccount.routes";
import TransactionRoutes from "./transaction.routes";
import TaxRoutes from "./tax.routes";
import adminRoutes from './admin.routes';

const routes = Router();

routes.use('/user',UserRoutes);
routes.use('/auth',AuthRoutes);
routes.use('/bank',OAuthBankRoutes);  // OAuth routes: /test, /start, /callback 
routes.use('/bank/api',BankRoutes);   // Bank API routes under /bank/api to avoid conflicts
routes.use('/accounts', FinancialAccountRoutes);
routes.use('/transactions', TransactionRoutes);
routes.use('/tax', TaxRoutes);
routes.use('/admin', adminRoutes);

export default routes;

/*import { Router } from "express";
const routes = Router();

routes.use('/user', require('./user.routes'));
export default routes;*/


