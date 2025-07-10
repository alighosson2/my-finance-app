// src/routes/userRoutes.ts
import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

// Wrap all async routes with asyncHandler
router.route('/')
  .get(asyncHandler(userController.getAllUsers.bind(userController)))
  .post(asyncHandler(userController.createUser.bind(userController)));

  // Remove asyncHandler wrapper for getUserById
router.route('/:id')
  .get(userController.getUserById.bind(userController)) // ← Direct binding
  //.put(asyncHandler(userController.updateUser.bind(userController)))
  //.delete(asyncHandler(userController.deleteUser.bind(userController)));

export default router;
