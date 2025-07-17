import { user_role, BankToken, financial_accounts } from '@prisma/client';

// 1. Use Prisma's generated enum directly
export { user_role as UserRole };

// 2. Prisma-like Base Interface (updated with relationships)
export interface IUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  profile_settings?: any;
  date_joined?: Date | null;
  is_active?: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  role: user_role;
  bank_tokens?: BankToken[];
  financial_accounts?: financial_accounts[];
}

// 3. Entity class with logic (updated with relationships)
export class UserEntity implements IUser {
  private _email: string;

  constructor(
    public id: number,
    public name: string,
    email: string,
    public password_hash: string,
    public role: user_role = user_role.user,
    public profile_settings: any = {},
    public date_joined: Date | null = new Date(),
    public is_active: boolean | null = true,
    public created_at: Date | null = new Date(),
    public updated_at: Date | null = new Date(),
    public bank_tokens?: BankToken[],
    public financial_accounts?: financial_accounts[]
  ) {
    this._email = email.toLowerCase();
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    if (!value.includes('@')) {
      throw new Error('Invalid email address');
    }
    this._email = value.toLowerCase();
  }

  get isAdmin(): boolean {
    return this.role === user_role.admin;
  }

  getId(): number {
    return this.id;
  }

  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      password_hash: this.password_hash,
      role: this.role,
      profile_settings: this.profile_settings,
      date_joined: this.date_joined,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      bank_tokens: this.bank_tokens,
      financial_accounts: this.financial_accounts
    };
  }
}

// 4. DTO (unchanged)
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: user_role;
}

// 5. Mapper function (unchanged)
export function toUserDto(user: UserEntity): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// 6. Helper functions (unchanged)
export const UserRoleHelpers = {
  isAdmin: (role: user_role): boolean => role === user_role.admin,
  isManager: (role: user_role): boolean => role === user_role.manager,
  isUser: (role: user_role): boolean => role === user_role.user,
};