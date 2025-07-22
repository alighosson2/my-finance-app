import { PrismaClient, users, user_role } from '@prisma/client';
import { ConnectionManager } from './ConnectionManager';
import { id, IUserRepository } from './IRepository';
import { UserEntity, UserRole } from '../model/Usermodel';

function toUserEntity(user: users & {
  bank_tokens?: any[];
  financial_accounts?: any[];
}): UserEntity {
  return new UserEntity(
    user.id,
    user.name,
    user.email,
    user.password_hash,
    user.role as UserRole,
    user.profile_settings ?? {},
    user.date_joined ?? new Date(),
    user.is_active ?? true,
    user.created_at ?? new Date(),
    user.updated_at ?? new Date(),
    user.bank_tokens,
    user.financial_accounts
  );
}

export class UserRepository implements IUserRepository {
  private prisma: PrismaClient | null = null;

  async init(): Promise<void> {
    this.prisma = await ConnectionManager.getConnection();
  }

  private ensureConnected(): void {
    if (!this.prisma) throw new Error('Database not initialized');
  }

  private parseId(id: id): number {
    if (id <= 0) throw new Error('Invalid user ID');
    return id;
  }

  async create(user: users): Promise<users> {
    this.ensureConnected();
    const existing = await this.prisma!.users.findUnique({
      where: { email: user.email }
    });
    if (existing) throw new Error('User with this email already exists');

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

  async update(id: id, user: UserEntity): Promise<UserEntity | null> {
    this.ensureConnected();
    this.parseId(id);

    const existing = await this.prisma!.users.findUnique({ where: { id } });
    if (!existing) throw new Error('User not found');

    const updated = await this.prisma!.users.update({
      where: { id },
      data: {
        name: user.name,
        email: user.email,
        password_hash: user.password_hash,
        profile_settings: user.profile_settings ?? {},
        is_active: user.is_active,
        role: user.role,
        updated_at: new Date(),
      },
    });
    return toUserEntity(updated);
  }

  async get(id: id): Promise<UserEntity> {
    this.ensureConnected();
    this.parseId(id);
    const user = await this.prisma!.users.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return toUserEntity(user);
  }

  async getByEmail(email: string): Promise<UserEntity> {
    this.ensureConnected();
    if (!email?.includes('@')) throw new Error('Invalid email address');
    const user = await this.prisma!.users.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    return toUserEntity(user);
  }

  async getAll(): Promise<users[]> {
    this.ensureConnected();
    return this.prisma!.users.findMany();
  }

  async delete(id: id): Promise<void> {
    this.ensureConnected();
    this.parseId(id);
    const user = await this.prisma!.users.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    await this.prisma!.users.delete({ where: { id } });
  }

  // NEW: Relationship methods
  async getWithBankTokens(id: id): Promise<UserEntity> {
    this.ensureConnected();
    const user = await this.prisma!.users.findUnique({
      where: { id },
      include: { bank_tokens: true }
    });
    if (!user) throw new Error('User not found');
    return toUserEntity(user);
  }

  async getWithAccounts(id: id): Promise<UserEntity> {
    this.ensureConnected();
    const user = await this.prisma!.users.findUnique({
      where: { id },
      include: { financial_accounts: true }
    });
    if (!user) throw new Error('User not found');
    return toUserEntity(user);
  }
}

export async function createUserRepository(): Promise<IUserRepository> {
  const repo = new UserRepository();
  await repo.init();
  return repo;
}
