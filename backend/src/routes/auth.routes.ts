//src/routes/auth.routes.ts
import express from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuthenticationController } from '../controllers/AunthenticationController';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/errorMiddleware';


const router =express.Router();
const authservice=new AuthenticationService();
const userService=new UserService();
const AuthController=new AuthenticationController(authservice,userService)
router.route('/login')
     .post(asyncHandler(AuthController.login.bind(AuthController)));
router.route('/logout') 
     .get(asyncHandler(AuthController.logout.bind(AuthController)))

export default router;
