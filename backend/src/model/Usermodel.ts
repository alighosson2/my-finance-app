import { user_role } from '@prisma/client';

// 1. Use Prisma's generated enum directly
export { user_role as UserRole };

// 2. Prisma-like Base Interface (optional but useful for typings)
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
  role: user_role; // Use Prisma's enum
}

// 3. Entity class with logic (getters/setters)
export class UserEntity implements IUser {
  private _email: string;

  constructor(
    public id: number,
    public name: string,
    email: string,
    public password_hash: string,
    public role: user_role = user_role.user, // Use Prisma's enum
    public profile_settings: any = {},
    public date_joined: Date | null = new Date(),
    public is_active: boolean | null = true,
    public created_at: Date | null = new Date(),
    public updated_at: Date | null = new Date()
  ) {
    this._email = email.toLowerCase(); // normalize email
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
    return this.role === user_role.admin; // Use Prisma's enum
  }

  getId(): number {
    return this.id;
  }

  // Example logic method
  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  // 🔥 ADD THIS: Custom JSON serialization to ensure email is properly serialized
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email, // This will use the getter
      password_hash: this.password_hash,
      role: this.role,
      profile_settings: this.profile_settings,
      date_joined: this.date_joined,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

// 4. DTO: What you return to clients (no sensitive fields)
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: user_role; // Use Prisma's enum
}

// 5. Mapper function from Entity → DTO
export function toUserDto(user: UserEntity): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// 6. Helper functions for role checking (if needed)
export const UserRoleHelpers = {
  isAdmin: (role: user_role): boolean => role === user_role.admin,
  isManager: (role: user_role): boolean => role === user_role.manager,
  isUser: (role: user_role): boolean => role === user_role.user,
};