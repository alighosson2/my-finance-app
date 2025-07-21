// src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { BadRequestException } from '../exceptions/BadRequestException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ServiceException } from '../exceptions/ServiceException';
import logger from '../util/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', error);

  if (error instanceof BadRequestException) {
    res.status(400).json({
      error: 'Bad Request',
      message: error.message,
    });
    return;
  }

  if (error instanceof NotFoundException) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error instanceof ServiceException) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

// Async error wrapper to catch async errors in controllers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};