// src/routes/user.routes.ts
import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticate } from '../middleware/auth';

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

// Public routes (no authentication required)
router.route('/')
  .get(asyncHandler(userController.getAllUsers.bind(userController))) // Protected: get all users
  .post(asyncHandler(userController.createUser.bind(userController))); // Public: user registration

router.route('/:id')
  .get(asyncHandler(userController.getUserById.bind(userController))) // Protected: get user by ID
  .put(authenticate, asyncHandler(userController.updateUser.bind(userController))) // Protected: update user
  .delete(authenticate, asyncHandler(userController.deleteUser.bind(userController))); // Protected: delete user

router.route('/:id/bank-tokens')
  .get(authenticate, asyncHandler(userController.getUserBankTokens.bind(userController))); // Protected: get user bank tokens

export default router;
