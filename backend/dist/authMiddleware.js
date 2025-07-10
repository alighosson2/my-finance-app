"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : null;
    // Check for token in authorization header
    if (!token) {
        res.status(401).json({ error: 'Missing access token' });
        return; // Ensure no further code is executed
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return; // Ensure no further code is executed
        }
        req.user = payload;
        next(); // Pass control to the next middleware
    });
}
//# sourceMappingURL=authMiddleware.js.map