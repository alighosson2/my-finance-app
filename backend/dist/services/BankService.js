"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankService = void 0;
const BankRepository_1 = require("../Repositories/BankRepository");
const NotFoundException_1 = require("../exceptions/NotFoundException");
class BankService {
    constructor() {
        this.bankRepository = null;
    }
    async getRepo() {
        if (!this.bankRepository) {
            this.bankRepository = new BankRepository_1.BankRepository();
            await this.bankRepository.init();
        }
        return this.bankRepository;
    }
    async createToken(dto) {
        const repo = await this.getRepo();
        // Validate user_id is provided
        if (!dto.user_id || dto.user_id <= 0) {
            throw new Error('Valid user_id is required');
        }
        const token = await repo.create({
            id: 0, // This will be ignored by the repository
            user_id: dto.user_id,
            provider: dto.provider,
            access_token: dto.access_token,
            access_token_secret: dto.access_token_secret || null,
            refresh_token: dto.refresh_token || null,
            expires_at: dto.expires_at,
            created_at: new Date(),
            updated_at: new Date()
        });
        const result = await repo.getTokenById(token.id);
        if (!result) {
            throw new Error('Failed to retrieve created token');
        }
        return result;
    }
    async getTokenById(id) {
        const repo = await this.getRepo();
        const token = await repo.getTokenById(id);
        if (!token) {
            throw new NotFoundException_1.NotFoundException('Bank token not found');
        }
        return token;
    }
    async getTokensByUser(userId) {
        return (await this.getRepo()).getTokensByUser(userId);
    }
    async updateToken(id, dto) {
        const repo = await this.getRepo();
        const existing = await repo.getTokenById(id);
        if (!existing) {
            throw new NotFoundException_1.NotFoundException('Token not found');
        }
        const updated = await repo.update(id, {
            id: existing.id,
            user_id: existing.user_id,
            provider: dto.provider ?? existing.provider,
            access_token: dto.access_token ?? existing.access_token,
            access_token_secret: dto.access_token_secret !== undefined ? dto.access_token_secret : existing.access_token_secret,
            refresh_token: dto.refresh_token !== undefined ? dto.refresh_token : existing.refresh_token,
            expires_at: dto.expires_at ?? existing.expires_at,
            created_at: existing.created_at,
            updated_at: new Date()
        });
        if (!updated) {
            throw new Error('Failed to update token');
        }
        const result = await repo.getTokenById(id);
        if (!result) {
            throw new Error('Failed to retrieve updated token');
        }
        return result;
    }
    async deleteToken(id) {
        const repo = await this.getRepo();
        const token = await repo.getTokenById(id);
        if (!token) {
            throw new NotFoundException_1.NotFoundException('Token not found');
        }
        await repo.delete(id);
    }
    async connectBankAccount(userId, dto) {
        return await this.createToken({
            ...dto,
            user_id: userId
        });
    }
    async getUserBankTokens(userId) {
        return await this.getTokensByUser(userId);
    }
    async revokeBankToken(userId, tokenId) {
        const token = await this.getTokenById(tokenId);
        if (token.user_id !== userId) {
            throw new NotFoundException_1.NotFoundException('Bank token not found for this user');
        }
        await this.deleteToken(tokenId);
    }
}
exports.BankService = BankService;
//# sourceMappingURL=BankService.js.map