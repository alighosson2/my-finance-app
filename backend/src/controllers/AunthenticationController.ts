import { Request, Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../config/types';

export class AuthenticationController {
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      // if you prefer to redirect with query params:
      return res.redirect('/login.html?error=missing');
    }

    try {
      // 1. validate credentials
      const userId = await this.userService.validateUser(email, password);

      // 2. generate tokens & set cookies
      const token = this.authService.generateToken(userId);
      const refreshToken = this.authService.generateRefreshToken(userId);
      this.authService.setTokenIntoCookie(res, token);
      this.authService.setRefreshTokenIntoCookie(res, refreshToken);
      this.authService.persistAuthentication(res, userId);

      // 3. REDIRECT to dashboard
      return res.redirect('/dashboard.html');

    } catch (error) {
      // on invalid credentials
      return res.redirect('/login.html?error=invalid');
    }
  }

  // 🆕 NEW: Mobile API Login (JSON Response)
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
    this.authService.clearTokens(res);
    res.status(200).json({ message: 'Logout successful' });
  }

  // 🆕 NEW: Mobile API Logout
  async logoutAPI(req: AuthRequest, res: Response) {
    // For mobile, just return success (client handles token removal)
    res.status(200).json({ 
      success: true,
      message: 'Logout successful' 
    });
  }
}
