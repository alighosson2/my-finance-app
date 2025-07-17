import { Request, Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../config/types';
export class AuthenticationController {
    constructor(private authService: AuthenticationService,
        private userService: UserService
    ) { }
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestException('Email and password are required', {
                email: !email,
                password: !password

            });
        }
        try { //validate user
            const userId = await this.userService.validateUser(email, password);
            const token = this.authService.generateToken(userId)
            const refreshToken = this.authService.generateRefreshToken(userId)
            this.authService.setTokenIntoCookie(res, token);
            this.authService.setRefreshTokenIntoCookie(res, refreshToken)
            this.authService.persistAuthentication(res, userId)
            res.status(200).json({
                message: 'Login successful',
            });
        }
        catch (error) { throw new BadRequestException('invalid email or password'); }

    }
    async logout(req: AuthRequest, res: Response) {
        //his.authRequest=req as AuthRequest
        this.authService.clearTokens(res);
        res.status(200).json({
            message: 'Logout successful'
        });

    }
}