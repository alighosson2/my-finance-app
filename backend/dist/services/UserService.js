"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const UserRepository_1 = require("../Repositories/UserRepository");
const NotFoundException_1 = require("../exceptions/NotFoundException");
const SALT_ROUNDS = 10;
class UserService {
    constructor() {
        this.userRepository = null;
    }
    async getRepo() {
        if (!this.userRepository) {
            this.userRepository = await (0, UserRepository_1.createUserRepository)();
        }
        return this.userRepository;
    }
    async getAllUsers() {
        return (await this.getRepo()).getAll();
    }
    async getUserById(userId) {
        return (await this.getRepo()).get(userId);
    }
    async createUser(data) {
        const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const user = {
            id: 0,
            name: data.name,
            email: data.email,
            password_hash: hashedPassword,
            profile_settings: data.profile_settings ?? {},
            is_active: data.is_active ?? true,
            role: data.role ?? client_1.user_role.user,
            created_at: null,
            updated_at: null,
            date_joined: null,
        };
        return (await this.getRepo()).create(user);
    }
    async updateUser(userId, data) {
        const repo = await this.getRepo();
        const existing = await repo.get(userId);
        let password_hash = existing.password_hash;
        if (data.password) {
            password_hash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        }
        const toSave = {
            ...existing,
            ...data,
            password_hash,
            updated_at: new Date(),
        };
        const updated = await repo.update(userId, toSave);
        if (!updated)
            throw new Error(`User with id ${userId} could not be updated`);
        return updated;
    }
    async validateUser(email, password) {
        try {
            const user = await (await this.getRepo()).getByEmail(email);
            const passwordMatch = await bcrypt_1.default.compare(password, user.password_hash);
            if (!passwordMatch)
                throw new NotFoundException_1.NotFoundException('Invalid credentials');
            return user.id;
        }
        catch (error) {
            throw new NotFoundException_1.NotFoundException('Invalid credentials');
        }
    }
    async deleteUser(userId) {
        return (await this.getRepo()).delete(userId);
    }
    // NEW: Relationship methods
    async getUserWithBankTokens(userId) {
        return (await this.getRepo()).getWithBankTokens(userId);
    }
    async getUserWithAccounts(userId) {
        return (await this.getRepo()).getWithAccounts(userId);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map