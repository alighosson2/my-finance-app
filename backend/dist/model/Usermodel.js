"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoleHelpers = exports.UserEntity = exports.UserRole = void 0;
exports.toUserDto = toUserDto;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return client_1.user_role; } });
// 3. Entity class with logic (updated with relationships)
class UserEntity {
    constructor(id, name, email, password_hash, role = client_1.user_role.user, profile_settings = {}, date_joined = new Date(), is_active = true, created_at = new Date(), updated_at = new Date(), bank_tokens, financial_accounts) {
        this.id = id;
        this.name = name;
        this.password_hash = password_hash;
        this.role = role;
        this.profile_settings = profile_settings;
        this.date_joined = date_joined;
        this.is_active = is_active;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.bank_tokens = bank_tokens;
        this.financial_accounts = financial_accounts;
        this._email = email.toLowerCase();
    }
    get email() {
        return this._email;
    }
    set email(value) {
        if (!value.includes('@')) {
            throw new Error('Invalid email address');
        }
        this._email = value.toLowerCase();
    }
    get isAdmin() {
        return this.role === client_1.user_role.admin;
    }
    getId() {
        return this.id;
    }
    deactivate() {
        this.is_active = false;
        this.updated_at = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            password_hash: this.password_hash,
            role: this.role,
            profile_settings: this.profile_settings,
            date_joined: this.date_joined,
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at,
            bank_tokens: this.bank_tokens,
            financial_accounts: this.financial_accounts
        };
    }
}
exports.UserEntity = UserEntity;
// 5. Mapper function (unchanged)
function toUserDto(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}
// 6. Helper functions (unchanged)
exports.UserRoleHelpers = {
    isAdmin: (role) => role === client_1.user_role.admin,
    isManager: (role) => role === client_1.user_role.manager,
    isUser: (role) => role === client_1.user_role.user,
};
//# sourceMappingURL=Usermodel.js.map