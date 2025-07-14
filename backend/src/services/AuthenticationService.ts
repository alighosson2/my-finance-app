import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import config from "../config";
import { TokenPayload } from "../config/types";
import { InvalidTokenException, TOkenEXpiredExpection } from "../exceptions/AuthenticationExceptions";
import { ServiceException } from "../exceptions/ServiceException";
import logger from "../util/logger";


export class AuthenticationService {
  constructor(
    private secretKey = config.auth.secretKey,
    private tokenExpiration = config.auth.tokenExpiration
  ) { }
  generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      this.secretKey,
      { expiresIn: this.tokenExpiration }
    );
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
      throw new ServiceException('Token verifiaction failed')
    }
  }
  clear() {
    //todo
  }
}

//5:11,15:51,15:52,42:35
