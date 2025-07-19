"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationController = void 0;
const BadRequestException_1 = require("../exceptions/BadRequestException");
class AuthenticationController {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
    }
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestException_1.BadRequestException('Email and password are required', {
                email: !email,
                password: !password
            });
        }
        try { //validate user
            const userId = await this.userService.validateUser(email, password);
            const token = this.authService.generateToken(userId);
            const refreshToken = this.authService.generateRefreshToken(userId);
            this.authService.setTokenIntoCookie(res, token);
            this.authService.setRefreshTokenIntoCookie(res, refreshToken);
            this.authService.persistAuthentication(res, userId);
            res.status(200).json({
                message: 'Login successful',
            });
        }
        catch (error) {
            throw new BadRequestException_1.BadRequestException('invalid email or password');
        }
    }
    async logout(req, res) {
        //his.authRequest=req as AuthRequest
        this.authService.clearTokens(res);
        res.status(200).json({
            message: 'Logout successful'
        });
    }
}
exports.AuthenticationController = AuthenticationController;
//# sourceMappingURL=AunthenticationController.js.map