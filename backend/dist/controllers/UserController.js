"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const BadRequestException_1 = require("../exceptions/BadRequestException");
const NotFoundException_1 = require("../exceptions/NotFoundException");
const ServiceException_1 = require("../exceptions/ServiceException");
const logger_1 = __importDefault(require("../util/logger"));
class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async getAllUsers(req, res) {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json(users);
        }
        catch (error) {
            logger_1.default.error('Error fetching users', error);
            throw new ServiceException_1.ServiceException('Error fetching users');
        }
    }
    async getUserById(req, res) {
        try {
            const id = req.params.id;
            if (isNaN(Number(id))) {
                throw new BadRequestException_1.BadRequestException('Invalid user ID');
            }
            const user = await this.userService.getUserById(Number(id));
            res.status(200).json(user);
        }
        catch (error) {
            if (error.message === 'User not found') {
                throw new NotFoundException_1.NotFoundException('User not found');
            }
            throw new ServiceException_1.ServiceException('Error fetching user');
        }
    }
    async createUser(req, res) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password)
                throw new BadRequestException_1.BadRequestException('All fields required');
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                throw new BadRequestException_1.BadRequestException('Invalid email');
            }
            const newUser = await this.userService.createUser({ name, email, password });
            res.status(201).json(newUser);
        }
        catch (error) {
            throw new ServiceException_1.ServiceException('Error creating user');
        }
    }
    async updateUser(req, res) {
        try {
            const userId = Number(req.params.id);
            if (isNaN(userId))
                throw new BadRequestException_1.BadRequestException('Invalid user ID');
            const updated = await this.userService.updateUser(userId, req.body);
            res.status(200).json(updated);
        }
        catch (error) {
            if (error.message.includes('not found'))
                throw new NotFoundException_1.NotFoundException('User not found');
            throw new ServiceException_1.ServiceException('Error updating user');
        }
    }
    async deleteUser(req, res) {
        try {
            const userId = Number(req.params.id);
            if (isNaN(userId))
                throw new BadRequestException_1.BadRequestException('Invalid user ID');
            await this.userService.deleteUser(userId);
            res.status(204).send();
        }
        catch (error) {
            if (error.message === 'User not found')
                throw new NotFoundException_1.NotFoundException('User not found');
            throw new ServiceException_1.ServiceException('Error deleting user');
        }
    }
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                throw new BadRequestException_1.BadRequestException('Email and password required');
            const userId = await this.userService.validateUser(email, password);
            res.status(200).json({ userId, message: 'Login successful' });
        }
        catch (error) {
            if (error instanceof NotFoundException_1.NotFoundException)
                res.status(401).json({ message: 'Invalid credentials' });
            else
                res.status(500).json({ message: 'Internal server error' });
        }
    }
    // NEW: Relationship endpoints
    async getUserBankTokens(req, res) {
        try {
            const userId = Number(req.params.id);
            if (isNaN(userId))
                throw new BadRequestException_1.BadRequestException('Invalid user ID');
            const user = await this.userService.getUserWithBankTokens(userId);
            res.status(200).json(user.bank_tokens);
        }
        catch (error) {
            if (error.message === 'User not found')
                throw new NotFoundException_1.NotFoundException('User not found');
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getUserAccounts(req, res) {
        try {
            const userId = Number(req.params.id);
            if (isNaN(userId))
                throw new BadRequestException_1.BadRequestException('Invalid user ID');
            const user = await this.userService.getUserWithAccounts(userId);
            res.status(200).json(user.financial_accounts);
        }
        catch (error) {
            if (error.message === 'User not found')
                throw new NotFoundException_1.NotFoundException('User not found');
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map