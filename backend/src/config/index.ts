// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { StringValue } from 'ms';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export default {
  logDir: process.env.LOG_DIR || './logs',
  isDev: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  host: process.env.HOST || '0.0.0.0', // allow access from emulator/device
  static_files_path: path.join(__dirname, '../../static'),

  auth: {
    secretKey: process.env.JWT_SECRET_KEY || 'secret12345678',
    tokenExpiration: (process.env.TOKEN_EXPIRATION || '1h') as StringValue,
    refreshTokenExpiration: (process.env.REFRESH_TOKEN_EXPIRATION || '7d') as StringValue,
  },

  openBank: {
    consumerKey: process.env.OBP_CONSUMER_KEY || 'cjy5f0znivmgiothypjzwnyhi53ruz5o44vczzrf',
    consumerSecret: process.env.OBP_CONSUMER_SECRET || 'cjvkam3rd35boxmdahnjsmhy5hzr2s1wn3rsp5oj',
    baseUrl: process.env.OBP_BASE_URL || 'https://apisandbox.openbankproject.com',
    callbackUrl: process.env.OBP_CALLBACK_URL || 'http://localhost:3000/api/bank/callback',
  },
};
