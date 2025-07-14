// src/controllers/UserController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { BadRequestException } from '../exceptions/BadRequestException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ServiceException } from '../exceptions/ServiceException';
import logger from '../util/logger';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

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
      console.log(id);

      if (isNaN(Number(id)) || Number(id) <= 0) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      try {
        const user = await this.userService.getUserById(Number(id));
        console.log('✅ Controller got user:', user);
        res.status(200).json(user);
      } catch (error: any) {
        logger.error('Error fetching user', error);
        res.status(404).json({ message: 'User not found', error: error.message });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body; // Changed to password

      if (!name || !email || !password) { // Validate password
        throw new BadRequestException('All fields are required');
      }

      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Invalid email');
      }

      const newUser = await this.userService.createUser({
        name,
        email,
        password, // Pass password instead of password_hash
      });

      res.status(201).json(newUser);
    } catch (error) {
      logger.error('Error creating user', error);
      throw new ServiceException('Error creating user');
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const userId = Number(id);
    console.log(`Received ID: ${userId}`);

    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      // Create update payload with password handling
      const updatePayload = { ...req.body };
      
      if (updatePayload.password) {
        // Password will be hashed in service
        updatePayload.password = updatePayload.password;
      } else {
        // Remove password if not updating
        delete updatePayload.password;
      }

      const updated = await this.userService.updateUser(userId, updatePayload);
      console.log('Updated user:', updated);
      res.status(200).json(updated);
    } catch (error: any) {
      logger.error('Error updating user', error);
      if (error.message === 'User not found' || error.message.includes('could not be updated')) {
        throw new NotFoundException('User not found');
      }
      throw new ServiceException('Error updating user');
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const userId = Number(id);
    console.log(`Received ID: ${userId}`);

    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      await this.userService.deleteUser(userId);
      console.log('User deleted successfully');
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting user', error);
      if (error.message === 'User not found') {
        throw new NotFoundException('User not found');
      }
      throw new ServiceException('Error deleting user');
    }
  }

  // Add login method
  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }
      
      const userId = await this.userService.validateUser(email, password);
      res.status(200).json({ userId, message: 'Login successful' });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        res.status(401).json({ message: 'Invalid credentials' });
      } else {
        logger.error('Login error', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
}