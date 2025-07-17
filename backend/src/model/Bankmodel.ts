import { BankToken } from '@prisma/client';

export interface IBankToken {
  id: number;
  user_id: number;
  provider: string;
  access_token: string;
  access_token_secret?: string | null;
  refresh_token?: string | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class BankTokenEntity implements IBankToken {
  constructor(
    public id: number,
    public user_id: number,
    public provider: string,
    public access_token: string,
    public access_token_secret: string | null,
    public refresh_token: string | null,
    public expires_at: Date,
    public created_at: Date,
    public updated_at: Date
  ) {}

  static fromPrisma(token: BankToken): BankTokenEntity {
    return new BankTokenEntity(
      token.id,
      token.user_id,
      token.provider,
      token.access_token,
      token.access_token_secret,
      token.refresh_token,
      token.expires_at,
      token.created_at,
      token.updated_at
    );
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      provider: this.provider,
      expires_at: this.expires_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // Never expose tokens in responses
    };
  }
}

export interface CreateBankTokenDto {
  user_id: number;
  provider: string;
  access_token: string;
  access_token_secret?: string;
  refresh_token?: string;
  expires_at: Date;
}

export interface UpdateBankTokenDto {
  provider?: string;
  access_token?: string;
  access_token_secret?: string | null;
  refresh_token?: string | null;
  expires_at?: Date;
}