// src/routes/user.routes.ts
import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticate } from '../middleware/auth';

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

// Wrap all async routes with asyncHandler
router.route('/')
  .get(authenticate,asyncHandler(userController.getAllUsers.bind(userController)))
  .post(asyncHandler(userController.createUser.bind(userController)));

  // Remove asyncHandler wrapper for getUserById
router.route('/:id')
.get(asyncHandler(userController.getUserById.bind(userController)))
.put(authenticate,asyncHandler(userController.updateUser.bind(userController)))
.delete(authenticate,asyncHandler(userController.deleteUser.bind(userController)));

export default router;
  /*import { Router, Request, Response } from 'express';
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
.get(asyncHandler(userController.getUserById.bind(userController)))
.put(asyncHandler(userController.updateUser.bind(userController)))
.delete(asyncHandler(userController.deleteUser.bind(userController)));

export default router;*/
