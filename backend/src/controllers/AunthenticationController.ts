import { Request, Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../config/types';

export class AuthenticationController {
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) { }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.redirect('/login.html?error=missing');
    }

    try {
      // 1. validate credentials
      const userId = await this.userService.validateUser(email, password);
      // 2. Save Authentication State Inside a Web Cookie
      this.authService.persistAuthentication(res, userId);
      // 3. Redirect to dashboard
      return res.redirect('/dashboard.html');
    } catch (error) {
      if ((error as Error).message === 'User not found') {
        // on invalid credentials
        return res.redirect('/login.html?error=invalid');
      }
    }
  }

  //  Mobile API Login (JSON Response)
  async loginAPI(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    try {
      // 1. validate credentials
      const userId = await this.userService.validateUser(email, password);

      // 2. generate tokens (NO cookies for mobile)
      const token = this.authService.generateToken(userId);
      const refreshToken = this.authService.generateRefreshToken(userId);

      // 3. Return JSON response for mobile
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          userId,
          token,
          refreshToken,
          expiresIn: '1h' // Token expiration time
        }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    const AuthRequest = req as AuthRequest;
    // Remove Authentication State from Web Cookie
    this.authService.clearTokens(res);
    return res.redirect('/login.html');
  }

  // Mobile API Logout
  async logoutAPI(req: AuthRequest, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
}
