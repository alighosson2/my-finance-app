"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceException = void 0;
class ServiceException extends Error {
    constructor(message) {
        super(message);
        this.name = "ServiceException";
    }
}
exports.ServiceException = ServiceException;
//# sourceMappingURL=ServiceException.js.map