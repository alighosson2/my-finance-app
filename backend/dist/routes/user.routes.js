"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const UserService_1 = require("../services/UserService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const userService = new UserService_1.UserService();
const userController = new UserController_1.UserController(userService);
// Public routes (no authentication required)
router.route('/')
    .get((0, errorMiddleware_1.asyncHandler)(userController.getAllUsers.bind(userController))) // Protected: get all users
    .post((0, errorMiddleware_1.asyncHandler)(userController.createUser.bind(userController))); // Public: user registration
router.route('/:id')
    .get(auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(userController.getUserById.bind(userController))) // Protected: get user by ID
    .put(auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(userController.updateUser.bind(userController))) // Protected: update user
    .delete(auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(userController.deleteUser.bind(userController))); // Protected: delete user
router.route('/:id/bank-tokens')
    .get(auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(userController.getUserBankTokens.bind(userController))); // Protected: get user bank tokens
exports.default = router;
//# sourceMappingURL=user.routes.js.map