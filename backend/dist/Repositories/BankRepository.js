"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankRepository = void 0;
exports.createBankRepository = createBankRepository;
const ConnectionManager_1 = require("./ConnectionManager");
const Bankmodel_1 = require("../model/Bankmodel");
function toBankTokenEntity(token) {
    return new Bankmodel_1.BankTokenEntity(token.id, token.user_id, token.provider, token.access_token, token.access_token_secret, token.refresh_token, token.expires_at, token.created_at, token.updated_at);
}
class BankRepository {
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
            throw new Error('Invalid token ID');
        return id;
    }
    async create(token) {
        this.ensureConnected();
        // Validate required fields
        if (!token.user_id || token.user_id <= 0) {
            throw new Error('Valid user_id is required');
        }
        // Check if token already exists for this user and provider
        const existing = await this.prisma.bankToken.findFirst({
            where: {
                user_id: token.user_id,
                provider: token.provider
            }
        });
        if (existing) {
            throw new Error('Token already exists for this user and provider');
        }
        // Create the token without the id field (auto-generated)
        const createData = {
            user_id: token.user_id,
            provider: token.provider,
            access_token: token.access_token,
            access_token_secret: token.access_token_secret,
            refresh_token: token.refresh_token,
            expires_at: token.expires_at,
            created_at: token.created_at || new Date(),
            updated_at: token.updated_at || new Date()
        };
        return this.prisma.bankToken.create({
            data: createData
        });
    }
    async update(id, token) {
        this.ensureConnected();
        this.parseId(id);
        try {
            // Check if token exists
            const existing = await this.prisma.bankToken.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('Token not found');
            }
            // Update data without id and user_id (these shouldn't change)
            const updateData = {
                provider: token.provider,
                access_token: token.access_token,
                access_token_secret: token.access_token_secret,
                refresh_token: token.refresh_token,
                expires_at: token.expires_at,
                updated_at: new Date()
            };
            const updated = await this.prisma.bankToken.update({
                where: { id },
                data: updateData
            });
            return updated;
        }
        catch (error) {
            if (error.message === 'Token not found') {
                throw error;
            }
            throw new Error(`Failed to update token: ${error.message}`);
        }
    }
    async get(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const token = await this.prisma.bankToken.findUnique({
                where: { id },
            });
            if (!token) {
                throw new Error('Token not found');
            }
            return toBankTokenEntity(token);
        }
        catch (error) {
            if (error.message === 'Token not found') {
                throw error;
            }
            throw new Error(`Failed to get token: ${error.message}`);
        }
    }
    async getAll() {
        this.ensureConnected();
        return this.prisma.bankToken.findMany();
    }
    async delete(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const token = await this.prisma.bankToken.findUnique({
                where: { id },
            });
            if (!token) {
                throw new Error('Token not found');
            }
            await this.prisma.bankToken.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error.message === 'Token not found') {
                throw error;
            }
            throw new Error(`Failed to delete token: ${error.message}`);
        }
    }
    // Bank-specific methods
    async getTokensByUser(userId) {
        this.ensureConnected();
        if (userId <= 0) {
            throw new Error('Invalid user ID');
        }
        try {
            const tokens = await this.prisma.bankToken.findMany({
                where: { user_id: userId }
            });
            return tokens.map(toBankTokenEntity);
        }
        catch (error) {
            throw new Error(`Failed to get tokens: ${error.message}`);
        }
    }
    async getTokenById(id) {
        this.ensureConnected();
        this.parseId(id);
        try {
            const token = await this.prisma.bankToken.findUnique({
                where: { id },
            });
            return token ? toBankTokenEntity(token) : null;
        }
        catch (error) {
            throw new Error(`Failed to get token: ${error.message}`);
        }
    }
}
exports.BankRepository = BankRepository;
async function createBankRepository() {
    const repo = new BankRepository();
    await repo.init();
    return repo;
}
//# sourceMappingURL=BankRepository.js.map