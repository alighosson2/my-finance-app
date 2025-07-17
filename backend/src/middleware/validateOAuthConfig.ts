// src/middleware/validateOAuthConfig.ts
import { Request, Response, NextFunction } from 'express';
import config from '../config';

export const validateOAuthConfig = (req: Request, res: Response, next: NextFunction): void => {
  const requiredFields = [
    'consumerKey',
    'consumerSecret',
    'baseUrl',
    'callbackUrl'
  ] as const;
  
  const missingFields = requiredFields.filter(field => !config.openBank[field]);
  
  if (missingFields.length > 0) {
    res.status(500).json({
      message: 'OAuth configuration incomplete',
      missingFields
    });
    return;
  }
  
  next();
};
//w
