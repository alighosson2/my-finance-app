import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ServiceException } from '../exceptions/ServiceException';
import logger from '../util/logger';

export class UserController {
  constructor(private userService: UserService) {}

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      logger.error('Error fetching users', error);
      throw new ServiceException('Error fetching users');
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (isNaN(Number(id)))
         {throw new BadRequestException('Invalid user ID');}
      const user = await this.userService.getUserById(Number(id));
      res.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'User not found') {
        throw new NotFoundException('User not found');
      }
      throw new ServiceException('Error fetching user');
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) throw new BadRequestException('All fields required');
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        throw new BadRequestException('Invalid email');
      }
      const newUser = await this.userService.createUser({ name, email, password });
      res.status(201).json(newUser);
    } catch (error) {
      throw new ServiceException('Error creating user');
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) throw new BadRequestException('Invalid user ID');
      const updated = await this.userService.updateUser(userId, req.body);
      res.status(200).json(updated);
    } catch (error: any) {
      if (error.message.includes('not found')) throw new NotFoundException('User not found');
      throw new ServiceException('Error updating user');
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) throw new BadRequestException('Invalid user ID');
      await this.userService.deleteUser(userId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'User not found') throw new NotFoundException('User not found');
      throw new ServiceException('Error deleting user');
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new BadRequestException('Email and password required');
      const userId = await this.userService.validateUser(email, password);
      res.status(200).json({ userId, message: 'Login successful' });
    } catch (error: any) {
      if (error instanceof NotFoundException) res.status(401).json({ message: 'Invalid credentials' });
      else res.status(500).json({ message: 'Internal server error' });
    }
  }

  // NEW: Relationship endpoints
  async getUserBankTokens(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) throw new BadRequestException('Invalid user ID');
      const user = await this.userService.getUserWithBankTokens(userId);
      res.status(200).json(user.bank_tokens);
    } catch (error: any) {
      if (error.message === 'User not found') throw new NotFoundException('User not found');
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getUserAccounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) throw new BadRequestException('Invalid user ID');
      const user = await this.userService.getUserWithAccounts(userId);
      res.status(200).json(user.financial_accounts);
    } catch (error: any) {
      if (error.message === 'User not found') throw new NotFoundException('User not found');
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}