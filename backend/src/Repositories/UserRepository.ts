// UserRepository.ts
import { PrismaClient, users, user_role } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { initializableRepository, id } from './IRepository';
import logger from '../util/logger';

export class UserRepository implements initializableRepository<users> {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    this.prisma = await ConnectionManager.getConnection();
  }

  private ensureConnected(): void {
    if (!this.prisma) throw new Error('Database not initialized');
  }
  
  async create(user: users): Promise<users> {
    this.ensureConnected();
    
    // Check for existing user by email
    const existing = await this.prisma!.users.findUnique({ 
      where: { email: user.email } 
    });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Don't include the id in the create data - let Prisma handle it
    const { id, created_at, updated_at, date_joined, ...userData } = user;
    
    return this.prisma!.users.create({
      data: {
        ...userData,
        profile_settings: userData.profile_settings ?? {},
        is_active: userData.is_active ?? true,
        role: userData.role ?? user_role.user,
      },
    });
  }

  async update(id: id, user: users): Promise<users | null> {
    this.ensureConnected();
    
    const numId = this.parseId(id);
    
    const existing = await this.prisma!.users.findUnique({ 
      where: { id: numId } 
    });
    if (!existing) return null;

    // Don't include id, created_at, date_joined in update data
    const { id: _, created_at, date_joined, ...updateData } = user;

    return this.prisma!.users.update({
      where: { id: numId },
      data: {
        ...updateData,
        profile_settings: updateData.profile_settings ?? {},
        updated_at: new Date(),
      },
    });
  }

private parseId(id: id): number {
  if (id <= 0) {
    throw new Error('Invalid user ID');
  }
  return id; // No conversion needed
}
async get(id: id): Promise<users> {
  this.ensureConnected();
  const numId = this.parseId(id); // Validates but doesn’t convert

  try {
    const user = await this.prisma!.users.findUnique({
      where: { id: numId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    if ((error as Error).message === 'User not found') {
      throw error;
    }
    throw new Error(`Failed to get user: ${(error as Error).message}`);
  }
}
  async getAll(): Promise<users[]> {
    this.ensureConnected();
    return this.prisma!.users.findMany();
  }

  async delete(id: id): Promise<void> {
    this.ensureConnected();
    
    const numId = this.parseId(id);
    
    try {
      await this.prisma!.users.delete({ where: { id: numId } });
    } catch (error) {
      if ((error as Error).message.includes('Record to delete does not exist')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }
}

export async function createUserRepository(): Promise<UserRepository> {
  const repo = new UserRepository();
  await repo.init();
  return repo;
}