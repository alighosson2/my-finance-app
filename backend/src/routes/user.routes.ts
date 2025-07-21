// src/routes/user.routes.ts
import express from 'express';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

// 🌐 Web User routes (redirects for registration)
router.route('/')
  .get(asyncHandler(userController.getAllUsers.bind(userController)))
  .post(asyncHandler(userController.createUser.bind(userController)));

// 📱 Mobile API User routes (JSON responses)
router.route('/register-api')
  .post(asyncHandler(userController.createUserAPI.bind(userController)));

router.route('/:id')
  .get(asyncHandler(userController.getUserById.bind(userController)))
  .put(asyncHandler(userController.updateUser.bind(userController)))
  .delete(asyncHandler(userController.deleteUser.bind(userController)));

router.route('/login')
  .post(asyncHandler(userController.loginUser.bind(userController)));

router.route('/:id/bank-tokens')
  .get(authenticate, asyncHandler(userController.getUserBankTokens.bind(userController)));

router.route('/:id/accounts')
  .get(authenticate, asyncHandler(userController.getUserAccounts.bind(userController)));

export default router;
