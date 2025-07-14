// UserService.ts
import bcrypt from 'bcrypt';
import { users, user_role } from '@prisma/client';
import { createUserRepository } from '../Repositories/UserRepository';
import { id, initializableRepository } from '../Repositories/IRepository';
import logger from '../util/logger';
import { NotFoundException } from '../exceptions/NotFoundException';

const SALT_ROUNDS = 10;

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  profile_settings?: any;
  is_active?: boolean;
  role?: user_role;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
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
  console.log('🔍 Original password:', data.password);
  
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  console.log('🔐 Hashed password:', hashedPassword);
  
  const user: users = {
    id: 0,
    name: data.name,
    email: data.email,
    password_hash: hashedPassword,
    profile_settings: data.profile_settings ?? {},
    is_active: data.is_active ?? true,
    role: data.role ?? user_role.user,
    created_at: null,
    updated_at: null,
    date_joined: null,
  };
  
  console.log('📝 User object before save:', user);
  
  const result = await (await this.getRepo()).create(user);
  console.log('💾 Result from database:', result);
  
  return result;
}

  async updateUser(userId: id, data: UpdateUserRequest): Promise<users> {
    const repo = await this.getRepo();
    const existing = await repo.get(userId);

    let password_hash = existing.password_hash;
    if (data.password) {
      password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const toSave: users = {
      ...existing,
      ...data,
      password_hash,
      updated_at: new Date(),
    };

    const updated = await repo.update(userId, toSave);
    if (!updated) {
      throw new Error(`User with id ${userId} could not be updated`);
    }

    return updated;
  }

async validateUser(email: string, password: string): Promise<id> {
    try {
        const user = await (await this.getRepo()).getByEmail(email);
        
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            throw new NotFoundException('Invalid credentials');
        }
        
        return user.id;
    } catch (error: any) {
        // If user not found or any other error, throw invalid credentials
        throw new NotFoundException('Invalid credentials');
    }
}

  async deleteUser(userId: id): Promise<void> {
    return (await this.getRepo()).delete(userId);
  }
}