"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = void 0;
const HttpException_1 = require("./HttpException");
class BadRequestException extends HttpException_1.HttpException {
    constructor(message = "Bad Request", details) {
        super(400, message, details);
        this.name = "BadRequestException";
    }
}
exports.BadRequestException = BadRequestException;
//# sourceMappingURL=BadRequestException.js.map