"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AunthenticationFailedException = exports.InvalidTokenException = exports.TOkenEXpiredExpection = exports.AuthenticationExceptions = void 0;
const HttpException_1 = require("./HttpException");
class AuthenticationExceptions extends HttpException_1.HttpException {
    constructor(message) {
        super(401, message);
        this.name = "AuthenticationException";
    }
}
exports.AuthenticationExceptions = AuthenticationExceptions;
class TOkenEXpiredExpection extends AuthenticationExceptions {
    constructor() {
        super("TokenExpired");
        this.name = "TokenExpiredException";
    }
}
exports.TOkenEXpiredExpection = TOkenEXpiredExpection;
class InvalidTokenException extends AuthenticationExceptions {
    constructor() {
        super("InvalidToken");
        this.name = "InvalidTokenException";
    }
}
exports.InvalidTokenException = InvalidTokenException;
class AunthenticationFailedException extends AuthenticationExceptions {
    constructor() {
        super("AunthenticationFailed");
        this.name = "AunthenticationFailedException";
    }
}
exports.AunthenticationFailedException = AunthenticationFailedException;
//# sourceMappingURL=AuthenticationExceptions.js.map