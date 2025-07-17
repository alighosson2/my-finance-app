import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import config from "../config";
import { TokenPayload } from "../config/types";
import { InvalidTokenException, TOkenEXpiredExpection } from "../exceptions/AuthenticationExceptions";
import { ServiceException } from "../exceptions/ServiceException";
import logger from "../util/logger";
import { Response } from "express";
import ms from "ms";

export class AuthenticationService {
  constructor(
    private secretKey = config.auth.secretKey,
    private tokenExpiration = config.auth.tokenExpiration,
    private refreshTokenExpiration = config.auth.refreshTokenExpiration
  ) { }
  generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      this.secretKey,
      { expiresIn: this.tokenExpiration }
    );
  }
  generateRefreshToken(userId: number): string {
    return jwt.sign({ userId },
      this.secretKey,
      { expiresIn: this.refreshTokenExpiration })
  }
  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secretKey) as TokenPayload;
    } catch (error) {
      logger.error('token verification failed', error)
      if (error instanceof jwt.TokenExpiredError) {
        throw new TOkenEXpiredExpection();
      }
      if (error instanceof jwt.JsonWebTokenError) { throw new InvalidTokenException() }
      throw new ServiceException('Token verifiaction failed');
    }
  }
  refreshToken(refreshToken: string){
    const payload = this.verify(refreshToken);
    if(!payload) {throw new InvalidTokenException()};
    return this.generateToken(payload.userId);
  }
  setTokenIntoCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: ms(this.tokenExpiration),
    });
  }
  setRefreshTokenIntoCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: ms(this.refreshTokenExpiration),
    });
  }
  clearTokens(res: Response) {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
  }
  persistAuthentication(res: Response, userId: number) {
    const token = this.generateToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    this.setTokenIntoCookie(res, token);
    this.setRefreshTokenIntoCookie(res, refreshToken);
///remember persist


  }
}

//5:11,15:51,15:52,42:35
