import { Request } from 'express';
import { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  userId:number; // ID of the user
  //exp: number;    // Expiration time (Unix timestamp)
  //iat: number;    // Issued-at time (Unix timestamp)
}

export interface AuthRequest extends Request {
  user_id: number;
}

