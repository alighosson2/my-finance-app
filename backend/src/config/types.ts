import { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  userId: string; // ID of the user
  //exp: number;    // Expiration time (Unix timestamp)
  //iat: number;    // Issued-at time (Unix timestamp)
}
