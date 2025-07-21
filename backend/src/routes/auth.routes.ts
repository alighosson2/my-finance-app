import express from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuthenticationController } from '../controllers/AunthenticationController';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const authService = new AuthenticationService();
const userService = new UserService();
const authController = new AuthenticationController(authService, userService);
const userController = new UserController(userService);

// 🌐 Web Authentication routes (redirects + cookies)
router.route('/login')
  .post(asyncHandler(authController.login.bind(authController)));

router.route('/logout')
  .get(authenticate, asyncHandler(authController.logout.bind(authController)));

// 📱 Mobile API Authentication routes (JSON responses)
router.route('/login-api')
  .post(asyncHandler(authController.loginAPI.bind(authController)));

router.route('/logout-api')
  .post(authenticate, asyncHandler(authController.logoutAPI.bind(authController)));

// Registration route - now properly typed
router.route('/register')
  .post(asyncHandler(userController.createUser.bind(userController)));

export default router;