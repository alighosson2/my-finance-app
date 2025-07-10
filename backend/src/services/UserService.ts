// UserService.ts
import { users, user_role } from '@prisma/client';
import { createUserRepository } from '../Repositories/UserRepository';
import { id, initializableRepository } from '../Repositories/IRepository';
import logger from '../util/logger';

interface CreateUserRequest {
  name: string;
  email: string;
  password_hash: string;
  profile_settings?: any;
  is_active?: boolean;
  role?: user_role;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  password_hash?: string;
  profile_settings?: any;
  is_active?: boolean;
  role?: user_role;
}

export class UserService {
  private userRepository: initializableRepository<users> | null = null;

  private async getRepo(): Promise<initializableRepository<users>> {
    if (!this.userRepository) {
      this.userRepository = await createUserRepository();
    }
    return this.userRepository;
  }

  async getAllUsers(): Promise<users[]> {
    return (await this.getRepo()).getAll();
  }

async getUserById(userId: id): Promise<users> {
  return (await this.getRepo()).get(userId);
}
  async createUser(data: CreateUserRequest): Promise<users> {
    // Create a proper user object for Prisma - don't include auto-generated fields
    const user: users = {
      id: 0, // This will be ignored by Prisma
      name: data.name,
      email: data.email,
      password_hash: data.password_hash,
      profile_settings: data.profile_settings ?? {},
      is_active: data.is_active ?? true,
      role: data.role ?? user_role.user,
      created_at: null, // Will be set by Prisma
      updated_at: null, // Will be set by Prisma
      date_joined: null, // Will be set by Prisma
    };

    return (await this.getRepo()).create(user);
  }

  async updateUser(userId: id, data: UpdateUserRequest): Promise<users> {
    const repo = await this.getRepo();

    // 1) Fetch existing record (will throw if not found)
    const existing = await repo.get(userId);

    // 2) Merge payload onto existing User
    const toSave: users = {
      ...existing,
      ...data,
      updated_at: new Date(),
    };

    // 3) Call through to repository.update (returns users|null)
    const updated = await repo.update(userId, toSave); // Use userId directly, not Number(userId)

    // 4) Handle the "not found" case if repo.update returned null
    if (!updated) {
      throw new Error(`User with id ${userId} could not be updated`);
    }

    return updated;
  }

  async deleteUser(userId: id): Promise<void> {
    return (await this.getRepo()).delete(userId);
  }
}