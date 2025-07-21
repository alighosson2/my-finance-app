// src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../util/logger';

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${err.name}: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Default error response
  let message = 'Server Error';
  let statusCode = 500;

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
  }

  if (err.name === 'CastError') {
    message = 'Invalid ID format';
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // Use custom status code if available
  if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status || 500;
    message = err.message;
  }

  // Database connection errors
  if (err.message?.includes('Database not initialized') || 
      err.message?.includes('Connection')) {
    statusCode = 503;
    message = 'Database connection error';
  }

  // Duplicate key error (user already exists)
  if (err.message?.includes('duplicate') || err.message?.includes('already exists')) {
    statusCode = 409;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};