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
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./auth"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("./authMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const rootPath = path_1.default.resolve(__dirname, '..');
const frontendPath = path_1.default.join(rootPath, 'frontend');
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(frontendPath));
app.get('/signup', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'signup.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'login.html'));
});
// Protected dashboard route
app.get('/dashboard', authMiddleware_1.authenticateToken, (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'dashboard.html'));
});
app.use('/api', auth_1.default);
app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.users.findMany();
    res.json(users);
}));
app.get('/', (req, res) => {
    res.send('Welcome to MyFinance360 API');
});
app.use((req, res) => {
    res.status(404).send('Page not found');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=server.js.map