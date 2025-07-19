"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTokenEntity = void 0;
class BankTokenEntity {
    constructor(id, user_id, provider, access_token, access_token_secret, refresh_token, expires_at, created_at, updated_at) {
        this.id = id;
        this.user_id = user_id;
        this.provider = provider;
        this.access_token = access_token;
        this.access_token_secret = access_token_secret;
        this.refresh_token = refresh_token;
        this.expires_at = expires_at;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static fromPrisma(token) {
        return new BankTokenEntity(token.id, token.user_id, token.provider, token.access_token, token.access_token_secret, token.refresh_token, token.expires_at, token.created_at, token.updated_at);
    }
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            provider: this.provider,
            expires_at: this.expires_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            // Never expose tokens in responses
        };
    }
}
exports.BankTokenEntity = BankTokenEntity;
//# sourceMappingURL=Bankmodel.js.map