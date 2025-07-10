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
    const id = parseInt(req.params.id, 10); // Convert string to number
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    try {
      const user = await this.userService.getUserById(id); // Now id is a number
      console.log('✅ Controller got user:', user); // Debug log
      res.status(200).json(user);
    } catch (error: any) {
      logger.error('Error fetching user', error);
      throw new NotFoundException('User not found');
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid ID or internal server error', error });
  }
}


  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password_hash } = req.body;

      if (!name || !email || !password_hash) {
        throw new BadRequestException('All fields are required');
      }

      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Invalid email');
      }

      const newUser = await this.userService.createUser({
        name,
        email,
        password_hash,
      });

      res.status(201).json(newUser);
    } catch (error) {
      logger.error('Error creating user', error);
      throw new ServiceException('Error creating user');
    }
  }

 /* async updateUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw new BadRequestException('User id is required');
    }

    try {
      const updated = await this.userService.updateUser(id, req.body);
      res.status(200).json(updated);
    } catch (error: any) {
      logger.error('Error updating user', error);
      // Check if it's a "User not found" error from the repository
      if (error.message === 'User not found' || error.message.includes('could not be updated')) {
        throw new NotFoundException('User not found');
      }
      throw new ServiceException('Error updating user');
    }
  }*/

 /* async deleteUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw new BadRequestException('User id is required');
    }

    try {
      await this.userService.deleteUser(id);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting user', error);
      // Check if it's a "User not found" error from the repository
      if (error.message === 'User not found') {
        throw new NotFoundException('User not found');
      }
      throw new ServiceException('Error deleting user');
    }
  }*/
}