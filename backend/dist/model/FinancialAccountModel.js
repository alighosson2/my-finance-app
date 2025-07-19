"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAccountEntity = void 0;
class FinancialAccountEntity {
    constructor(id, user_id, bank_token_id, account_name, account_type, // Use the Prisma enum type
    balance, currency, bank_name, account_number_masked, 
    // OBP Integration fields
    external_account_id, bank_id, last_synced_at, is_active, created_at, updated_at) {
        this.id = id;
        this.user_id = user_id;
        this.bank_token_id = bank_token_id;
        this.account_name = account_name;
        this.account_type = account_type;
        this.balance = balance;
        this.currency = currency;
        this.bank_name = bank_name;
        this.account_number_masked = account_number_masked;
        this.external_account_id = external_account_id;
        this.bank_id = bank_id;
        this.last_synced_at = last_synced_at;
        this.is_active = is_active;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static fromPrisma(account) {
        return new FinancialAccountEntity(account.id, account.user_id, account.bank_token_id || null, account.account_name, account.account_type, Number(account.balance), account.currency, account.bank_name, account.account_number_masked, 
        // OBP Integration fields (these will be null for existing accounts until we add the actual database fields)
        account.external_account_id || null, account.bank_id || null, account.last_synced_at || null, account.is_active ?? true, account.created_at ?? new Date(), account.updated_at ?? new Date());
    }
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            bank_token_id: this.bank_token_id,
            account_name: this.account_name,
            account_type: this.account_type,
            balance: this.balance,
            currency: this.currency,
            bank_name: this.bank_name,
            account_number_masked: this.account_number_masked,
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}
exports.FinancialAccountEntity = FinancialAccountEntity;
//# sourceMappingURL=FinancialAccountModel.js.map