"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Set this in .env
// POST /api/signup
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }
    const existing = yield prisma.users.findUnique({ where: { email } });
    if (existing) {
        res.status(400).json({ error: 'Email already in use' });
        return;
    }
    const hash = yield bcrypt_1.default.hash(password, 10);
    const user = yield prisma.users.create({
        data: { name, email, password_hash: hash },
        select: { id: true, name: true, email: true, created_at: true },
    });
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    // Optionally, store refreshToken in DB for revocation purposes
    // await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } });
    res
        .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
        .status(201)
        .json({
        message: 'User created successfully',
        user: { id: user.id, name: user.name, email: user.email },
        accessToken,
    });
}));
// POST /api/login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    const user = yield prisma.users.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, password_hash: true },
    });
    if (!user) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
    }
    const valid = yield bcrypt_1.default.compare(password, user.password_hash);
    if (!valid) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
    }
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    // Optionally, store refreshToken in DB for revocation purposes
    // await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } });
    res
        .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
        .json({
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email },
        accessToken,
    });
}));
// POST /api/refresh-token
router.post('/refresh-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.refreshToken;
    if (!token) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '7d' });
        // Optionally, rotate refresh tokens in DB
        // await prisma.refreshToken.delete({ where: { token } });
        // await prisma.refreshToken.create({ data: { userId: payload.userId, token: newRefreshToken } });
        res
            .cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
            .json({ accessToken: newAccessToken });
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
}));
exports.default = router;
//# sourceMappingURL=auth.js.map