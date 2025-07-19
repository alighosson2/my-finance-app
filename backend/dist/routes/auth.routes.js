"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/auth.routes.ts
const express_1 = __importDefault(require("express"));
const AuthenticationService_1 = require("../services/AuthenticationService");
const AunthenticationController_1 = require("../controllers/AunthenticationController");
const UserService_1 = require("../services/UserService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const authservice = new AuthenticationService_1.AuthenticationService();
const userService = new UserService_1.UserService();
const AuthController = new AunthenticationController_1.AuthenticationController(authservice, userService);
router.route('/login')
    .post((0, errorMiddleware_1.asyncHandler)(AuthController.login.bind(AuthController)));
router.route('/logout')
    .get(auth_1.authenticate, (0, errorMiddleware_1.asyncHandler)(AuthController.logout.bind(AuthController)));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map