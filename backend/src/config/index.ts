// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import {StringValue} from "ms";

// Load .env regardless of folder depth (safer)
dotenv.config({ path: path.join(__dirname, '../../.env') });

export default {
  logDir: process.env.LOG_DIR ||"./logs",
  isDev: process.env.NODE_ENV === 'development',                       // Boolean flag for dev mode
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
   host: process.env.HOST || 'localhost',   // Optional: hostname override

  frontendPath: path.join(__dirname, '../../frontend'),                // Path to static HTML files
  auth:{secretKey: process.env.JWT_SECRET_KEY|| "secret12345678",
    tokenExpiration:(process.env.TOKEN_EXPIRATION||"1h") as StringValue
  }
};
