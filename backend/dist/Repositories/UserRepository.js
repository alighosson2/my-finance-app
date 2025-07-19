"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
exports.createUserRepository = createUserRepository;
const client_1 = require("@prisma/client");
const ConnectionManager_1 = require("./ConnectionManager");
const Usermodel_1 = require("../model/Usermodel");
function toUserEntity(user) {
    return new Usermodel_1.UserEntity(user.id, user.name, user.email, user.password_hash, user.role, user.profile_settings ?? {}, user.date_joined ?? new Date(), user.is_active ?? true, user.created_at ?? new Date(), user.updated_at ?? new Date(), user.bank_tokens, user.financial_accounts);
}
class UserRepository {
    constructor() {
        this.prisma = null;
    }
    async init() {
        this.prisma = await ConnectionManager_1.ConnectionManager.getConnection();
    }
    ensureConnected() {
        if (!this.prisma)
            throw new Error('Database not initialized');
    }
    parseId(id) {
        if (id <= 0)
            throw new Error('Invalid user ID');
        return id;
    }
    async create(user) {
        this.ensureConnected();
        const existing = await this.prisma.users.findUnique({
            where: { email: user.email }
        });
        if (existing)
            throw new Error('User with this email already exists');
        const { id, created_at, updated_at, date_joined, ...userData } = user;
        return this.prisma.users.create({
            data: {
                ...userData,
                profile_settings: userData.profile_settings ?? {},
                is_active: userData.is_active ?? true,
                role: userData.role ?? client_1.user_role.user,
            },
        });
    }
    async update(id, user) {
        this.ensureConnected();
        this.parseId(id);
        const existing = await this.prisma.users.findUnique({ where: { id } });
        if (!existing)
            throw new Error('User not found');
        const updated = await this.prisma.users.update({
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
    async get(id) {
        this.ensureConnected();
        this.parseId(id);
        const user = await this.prisma.users.findUnique({ where: { id } });
        if (!user)
            throw new Error('User not found');
        return toUserEntity(user);
    }
    async getByEmail(email) {
        this.ensureConnected();
        if (!email?.includes('@'))
            throw new Error('Invalid email address');
        const user = await this.prisma.users.findUnique({ where: { email } });
        if (!user)
            throw new Error('User not found');
        return toUserEntity(user);
    }
    async getAll() {
        this.ensureConnected();
        return this.prisma.users.findMany();
    }
    async delete(id) {
        this.ensureConnected();
        this.parseId(id);
        const user = await this.prisma.users.findUnique({ where: { id } });
        if (!user)
            throw new Error('User not found');
        await this.prisma.users.delete({ where: { id } });
    }
    // NEW: Relationship methods
    async getWithBankTokens(id) {
        this.ensureConnected();
        const user = await this.prisma.users.findUnique({
            where: { id },
            include: { bank_tokens: true }
        });
        if (!user)
            throw new Error('User not found');
        return toUserEntity(user);
    }
    async getWithAccounts(id) {
        this.ensureConnected();
        const user = await this.prisma.users.findUnique({
            where: { id },
            include: { financial_accounts: true }
        });
        if (!user)
            throw new Error('User not found');
        return toUserEntity(user);
    }
}
exports.UserRepository = UserRepository;
async function createUserRepository() {
    const repo = new UserRepository();
    await repo.init();
    return repo;
}
//# sourceMappingURL=UserRepository.js.map