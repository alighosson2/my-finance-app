"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializableException = exports.InvalidItemException = exports.ItemNotFoundException = void 0;
class ItemNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = "ItemNotFoundException";
    }
}
exports.ItemNotFoundException = ItemNotFoundException;
class InvalidItemException extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidItemException ";
    }
}
exports.InvalidItemException = InvalidItemException;
class initializableException extends Error {
    constructor(message) {
        super(message);
        this.name = "initializableException";
    }
}
exports.initializableException = initializableException;
//# sourceMappingURL=RepositoryExceptions.js.map