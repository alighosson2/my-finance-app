//src/routes/index.ts
import { Router } from "express";
import  AuthRoutes from "../routes/auth.routes"
import  UserRoutes from "../routes/user.routes"
import { authenticate } from "../middleware/auth";

const routes = Router();

routes.use('/user',UserRoutes);
routes.use('/auth',AuthRoutes)
export default routes;

/*import { Router } from "express";
const routes = Router();

routes.use('/user', require('./user.routes'));
export default routes;*/


